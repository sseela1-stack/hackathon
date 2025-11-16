
import uuid, math
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import scenario_engine_choices as eng

APP_DIR = Path(__file__).parent
SCEN_DIR = APP_DIR / "scenarios"

try:
    CATALOG = eng.load_catalog_from_folder(str(SCEN_DIR))
    if not CATALOG:
        CATALOG = eng.build_default_catalog()
except Exception:
    CATALOG = eng.build_default_catalog()

app = FastAPI(title="Scenario Selection Game API")
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")

class SessionState:
    def __init__(self, user: eng.UserProfile):
        self.user = user
        self.selector = eng.ScenarioSelectorChoices(CATALOG.copy())
        self.day = 1
        self.offers = self.selector.propose_day(self.user, self.day)
        # HUD state
        self.health = 65.0
        self.accounts = {"checking": float(user.base_balance), "savings": 0.0, "investments": 0.0}
        self.achievements = set()
        self.donation_total = 0.0
        self.positive_streak = 0
        self.last_day_net = 0.0

    # --- Helpers for HUD ---
    def _month_info(self):
        month = (self.day - 1) // 30 + 1
        dom = (self.day - 1) % 30 + 1
        return month, dom

    def _apply_accounts(self, committed):
        """
        Update virtual accounts from committed events.
        Rule of thumb:
        - Paycheck & generic income → checking
        - Income tagged investment/investment_income → investments
        - Savings-tagged expenses (incl. Saving Plan Contribution) → transfer checking→savings
        - Investment-tagged expenses → transfer checking→investments
        - All other expenses/bills/donations/lottery → checking
        """
        for ev in committed:
            amt = float(ev.get("amount", 0.0))
            tags = set(ev.get("tags", []))
            t = ev.get("type")
            name = ev.get("name", "")
            if t == "income":
                if "investment" in tags or "investment_income" in tags:
                    self.accounts["investments"] += max(amt, 0.0)
                else:
                    self.accounts["checking"] += max(amt, 0.0)
            else:
                # expenses / bills / donation / lottery
                if "savings" in tags or name.lower().startswith("saving plan contribution"):
                    x = abs(amt)
                    self.accounts["checking"] -= x
                    self.accounts["savings"] += x
                elif "investment" in tags:
                    x = abs(amt)
                    self.accounts["checking"] -= x
                    self.accounts["investments"] += x
                else:
                    self.accounts["checking"] += amt  # amt is negative for outflows

    def _update_health_and_achievements(self, committed):
        # Net for the day
        day_net = sum(float(ev.get("amount", 0.0)) for ev in committed)
        # Donations sum (for achievement)
        donations_today = sum(abs(float(ev.get("amount", 0.0))) for ev in committed if ev.get("type") == "donation" or "donation" in set(ev.get("tags", [])))
        self.donation_total += donations_today

        # Positive/negative streak
        if day_net >= 0:
            self.positive_streak += 1
        else:
            self.positive_streak = 0

        # Health update
        delta = 0.0
        if day_net >= 0:
            delta += min(3.0, day_net / 500.0)
        else:
            delta -= min(6.0, abs(day_net) / 200.0)

        for ev in committed:
            tags = set(ev.get("tags", []))
            name = ev.get("name","").lower()
            if "emergency" in tags:
                delta -= 3.0
            if "fees" in tags:
                delta -= 2.0
            if "savings" in tags:
                delta += 1.0
            if "donation" in tags:
                delta += 0.5
            if "gambling" in tags and name.startswith("buy lottery ticket"):
                delta -= 0.2

        # Slight boost for building buffers
        buffer_score = 0.01 * (self.accounts["savings"] + 0.5*self.accounts["investments"])
        delta += min(2.0, buffer_score)

        self.health = float(max(0.0, min(100.0, self.health + delta)))
        self.last_day_net = day_net

        # --- Achievements (5 total) ---
        # A1: First Paycheck
        if any(ev.get("name") == "Paycheck" and float(ev.get("amount",0)) > 0 for ev in committed):
            self.achievements.add("first_paycheck")
        # A2: Emergency buffer $500 in savings
        if self.accounts["savings"] >= 500.0:
            self.achievements.add("buffer_500")
        # A3: Net positive 7 days in a row
        if self.positive_streak >= 7:
            self.achievements.add("streak_7")
        # A4: Donor $100 total
        if self.donation_total >= 100.0:
            self.achievements.add("donor_100")
        # A5: Lucky day (lottery result > 0)
        if any(ev.get("name") == "Lottery Result" and float(ev.get("amount",0)) > 0 for ev in committed):
            self.achievements.add("lotto_win")

    def hud(self) -> Dict:
        month, dom = self._month_info()
        return {
            "month": month,
            "day_in_month": dom,
            "health": round(self.health, 1),
            "trophies": {"earned": len(self.achievements), "total": 5},
            "accounts": {k: round(v, 2) for k, v in self.accounts.items()},
        }

class StartRequest(BaseModel):
    name: str = "Player"
    segment_key: str = "early_career"
    mood: str = "optimistic"
    pay_type: str = "biweekly"
    pay_start_day: int = 1
    pay_amount: float = 2200.0
    base_balance: float = 1500.0
    predispositions: Dict[str, float] = {}

class CommitRequest(BaseModel):
    session_id: str
    choices: Dict[str, str]

@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse(str(APP_DIR / "static" / "index.html"))

@app.get("/api/meta")
def meta():
    return {
        "segments": {k: {"name": v["name"], "description": v["description"]} for k, v in eng.SEGMENTS.items()},
        "moods": list(eng.MOODS.keys()),
        "defaults": {"segment_key": "early_career","mood": "optimistic","pay_type": "biweekly","pay_start_day": 1,"pay_amount": 2200.0,"base_balance": 1500.0}
    }

SESSIONS: Dict[str, SessionState] = {}

@app.post("/api/start")
def start(req: StartRequest):
    user = eng.UserProfile(
        name=req.name,
        segment_key=req.segment_key,
        mood=req.mood,
        pay_cycle={"type": req.pay_type, "start_day": req.pay_start_day, "amount": req.pay_amount},
        predispositions=req.predispositions,
        base_balance=req.base_balance,
    )
    session_id = str(uuid.uuid4())
    state = SessionState(user)
    SESSIONS[session_id] = state
    return {"session_id": session_id, "day": state.day, "balance": state.selector.balance, "offers": state.offers, "hud": state.hud(), "user": {"name": user.name, "segment_key": user.segment_key, "mood": user.mood, "pay_cycle": user.pay_cycle, "base_balance": user.base_balance}}

@app.get("/api/offers")
def get_offers(session_id: str):
    state = SESSIONS.get(session_id)
    if not state: raise HTTPException(status_code=404, detail="Invalid session_id")
    return {"day": state.day, "balance": state.selector.balance, "offers": state.offers, "hud": state.hud()}

@app.post("/api/commit")
def commit(req: CommitRequest):
    state = SESSIONS.get(req.session_id)
    if not state: raise HTTPException(status_code=404, detail="Invalid session_id")
    committed = state.selector.commit_day(state.day, req.choices)
    # Update HUD elements
    state._apply_accounts(committed)
    state._update_health_and_achievements(committed)
    # Advance to next day
    state.day += 1
    state.offers = state.selector.propose_day(state.user, state.day)
    return {"committed": committed, "balance": state.selector.balance, "day": state.day, "next_offers": state.offers, "hud": state.hud()}

@app.get("/api/state")
def get_state(session_id: str):
    state = SESSIONS.get(session_id)
    if not state: raise HTTPException(status_code=404, detail="Invalid session_id")
    return {"day": state.day, "balance": state.selector.balance, "history": state.selector.history[-100:], "hud": state.hud()}
