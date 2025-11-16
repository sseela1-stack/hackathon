
import json, math, random, uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

__all__ = [
    "SEGMENTS", "MOODS", "DISCRETIONARY_TAGS",
    "UserProfile", "SavingPlan",
    "ScenarioSelectorChoices",
    "build_default_catalog", "load_catalog_from_folder"
]

random.seed(42)
np.random.seed(42)

def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"

def lognormal_amount(mean: float, sigma: float, min_clip: float = 0.0, max_clip: Optional[float] = None) -> float:
    mu = math.log(max(mean, 1e-6)) - 0.5 * math.log(1 + (sigma / max(mean, 1e-6)) ** 2)
    s = math.sqrt(max(math.log(1 + (sigma / max(mean, 1e-6)) ** 2), 1e-9))
    sample = np.random.lognormal(mean=mu, sigma=s)
    if min_clip is not None: sample = max(sample, min_clip)
    if max_clip is not None: sample = min(sample, max_clip)
    return float(sample)

def draw_amount(spec: Dict[str, Any], context: Dict[str, Any]) -> float:
    dist = spec.get("dist", "fixed")
    if dist == "fixed":
        return float(spec["value"])
    elif dist == "uniform":
        return float(np.random.uniform(spec["low"], spec["high"]))
    elif dist == "normal":
        val = float(np.random.normal(spec["mean"], spec["sd"])); return max(val, spec.get("min", 0.0))
    elif dist == "lognormal":
        return lognormal_amount(spec["mean"], spec["sigma"], spec.get("min", 0.0), spec.get("max"))
    elif dist == "percent_of_pay":
        last_pay = context.get("last_pay_amount", context.get("default_pay_amount", 2000.0))
        return abs(last_pay) * float(spec.get("pct", 0.2))
    elif dist == "choice":
        opts = spec["options"]; w = spec.get("weights")
        return float(random.choices(opts, weights=w, k=1)[0])
    else:
        return float(spec.get("value", 0.0))

def geometric_mean(values: List[float]) -> float:
    if not values: return 1.0
    prod = 1.0
    for v in values: prod *= max(v, 1e-9)
    return prod ** (1.0 / len(values))

# -------------------- Segments, Moods, Tags --------------------

SEGMENTS: Dict[str, Dict[str, Any]] = {
    "student_dependent": {"name": "Student (Dependent)", "description": "...", "tag_weights": {"tuition": 1.6, "education": 1.4, "subscriptions": 1.2, "groceries": 0.9, "rent": 1.0, "leisure": 1.1, "donation": 0.7, "gambling": 0.8, "investment": 0.6, "salary": 0.6, "gig_income": 1.4, "transport": 1.0, "car": 0.7, "public_transit": 1.3, "electronics": 1.2}},
    "student_independent": {"name": "Student (Self-supporting)", "description": "...", "tag_weights": {"tuition": 1.6, "education": 1.3, "subscriptions": 1.0, "groceries": 1.1, "rent": 1.1, "leisure": 0.9, "donation": 0.6, "gambling": 0.7, "investment": 0.7, "salary": 0.9, "gig_income": 1.3, "transport": 1.1, "car": 0.9, "public_transit": 1.2, "fees": 1.1}},
    "unemployed_benefits": {"name": "Unemployed (With Benefits)", "description": "...", "tag_weights": {"salary": 0.1, "benefits_income": 2.0, "gig_income": 1.1, "leisure": 0.8, "groceries": 1.0, "emergency": 1.2, "fees": 1.2, "donation": 0.5, "investment": 0.4, "subscriptions": 0.9}},
    "unemployed_no_benefits": {"name": "Unemployed (No Benefits)", "description": "...", "tag_weights": {"salary": 0.1, "benefits_income": 0.5, "gig_income": 1.3, "leisure": 0.5, "groceries": 1.0, "emergency": 1.3, "fees": 1.3, "donation": 0.3, "investment": 0.3, "subscriptions": 0.8, "debt": 1.3}},
    "early_career": {"name": "Early Career", "description": "...", "tag_weights": {"salary": 1.2, "gig_income": 1.0, "leisure": 1.2, "groceries": 1.0, "subscriptions": 1.3, "donation": 0.9, "gambling": 0.9, "investment": 0.9, "rent": 1.2, "transport": 1.1, "electronics": 1.1}},
    "mid_career": {"name": "Mid-career Professional", "description": "...", "tag_weights": {"salary": 1.2, "investment": 1.2, "childcare": 1.4, "mortgage": 1.3, "insurance": 1.2, "subscriptions": 1.1, "leisure": 1.0, "donation": 1.1, "groceries": 1.2, "car": 1.2}},
    "senior_professional": {"name": "Senior Professional", "description": "...", "tag_weights": {"salary": 1.3, "investment": 1.5, "leisure": 1.3, "luxury": 1.3, "donation": 1.2, "subscriptions": 1.2, "travel": 1.3, "electronics": 1.2, "fees": 1.0}},
    "executive_high_income": {"name": "Executive / High Income", "description": "...", "tag_weights": {"salary": 1.4, "investment": 1.6, "leisure": 1.4, "luxury": 1.6, "donation": 1.5, "travel": 1.5, "subscriptions": 1.2, "fees": 1.0, "mortgage": 1.2}},
    "gig_worker": {"name": "Gig Worker / Freelancer", "description": "...", "tag_weights": {"salary": 0.6, "gig_income": 2.0, "freelance_income": 1.8, "transport": 1.4, "car": 1.2, "public_transit": 1.1, "subscriptions": 1.0, "investment": 0.8, "fees": 1.1}},
    "part_time_worker": {"name": "Part-time Worker", "description": "...", "tag_weights": {"salary": 0.8, "leisure": 0.9, "subscriptions": 1.0, "donation": 0.8, "groceries": 1.0, "transport": 1.0, "fees": 1.0, "investment": 0.8}},
    "parent_young_children": {"name": "Parent (Young Children)", "description": "...", "tag_weights": {"childcare": 1.8, "groceries": 1.3, "healthcare": 1.2, "leisure": 0.9, "subscriptions": 1.1, "donation": 1.0, "education": 1.2, "transport": 1.2, "gift": 1.3}},
    "single_no_kids": {"name": "Single (No Kids)", "description": "...", "tag_weights": {"leisure": 1.3, "social": 1.3, "rent": 1.2, "mortgage": 0.7, "travel": 1.2, "subscriptions": 1.2, "donation": 1.0, "investment": 1.0}},
    "retired_modest": {"name": "Retired (Modest)", "description": "...", "tag_weights": {"salary": 0.2, "pension_income": 1.6, "investment": 1.1, "healthcare": 1.5, "leisure": 0.9, "donation": 0.9, "subscriptions": 1.0, "fees": 1.1, "utilities": 1.1}},
    "retired_well_off": {"name": "Retired (Well-off)", "description": "...", "tag_weights": {"salary": 0.2, "pension_income": 1.4, "investment": 1.4, "healthcare": 1.3, "leisure": 1.2, "donation": 1.2, "travel": 1.4, "luxury": 1.2}},
    "entrepreneur": {"name": "Entrepreneur / Small Business Owner", "description": "...", "tag_weights": {"salary": 0.6, "owner_draw": 1.6, "freelance_income": 1.4, "investment": 1.2, "subscriptions": 1.2, "travel": 1.2, "fees": 1.1, "electronics": 1.2}},
    "public_sector": {"name": "Public Sector / Teacher", "description": "...", "tag_weights": {"salary": 1.2, "donation": 1.1, "education": 1.2, "subscriptions": 1.0, "leisure": 1.0, "fees": 1.0, "insurance": 1.1}},
    "healthcare_worker": {"name": "Healthcare Worker", "description": "...", "tag_weights": {"salary": 1.2, "leisure": 1.0, "transport": 1.1, "dining": 1.2, "groceries": 1.1, "subscriptions": 1.1, "fees": 1.0, "healthcare": 1.1}},
    "remote_worker": {"name": "Remote Worker", "description": "...", "tag_weights": {"internet": 1.2, "utilities": 1.1, "transport": 0.8, "electronics": 1.2, "subscriptions": 1.1}},
    "urban_high_cost": {"name": "Urban (High-Cost Area)", "description": "...", "tag_weights": {"rent": 1.5, "mortgage": 0.8, "public_transit": 1.5, "car": 0.6, "dining": 1.2}},
    "rural": {"name": "Rural", "description": "...", "tag_weights": {"car": 1.5, "fuel": 1.3, "public_transit": 0.6, "rent": 0.9, "utilities": 1.1}},
}

MOODS: Dict[str, Dict[str, float]] = {
    "optimistic": {"investment": 1.2, "leisure": 1.1, "donation": 1.1, "savings": 1.05},
    "pessimistic": {"investment": 0.8, "leisure": 0.9, "savings": 1.1},
    "stressed": {"convenience": 1.2, "dining": 1.15, "leisure": 0.95, "savings": 0.95},
    "bored": {"leisure": 1.3, "entertainment": 1.2, "gambling": 1.2, "shopping": 1.15},
    "generous": {"donation": 1.5, "gift": 1.2},
    "frugal": {"leisure": 0.8, "shopping": 0.85, "savings": 1.2},
    "reckless": {"gambling": 1.6, "luxury": 1.2, "investment": 1.1},
    "disciplined": {"savings": 1.4, "debt": 1.1, "donation": 0.9},
    "social": {"social": 1.4, "leisure": 1.1, "dining": 1.2, "travel": 1.1},
    "lonely": {"leisure": 0.9, "shopping": 1.1, "subscriptions": 1.05},
}

DISCRETIONARY_TAGS = {"leisure", "entertainment", "shopping", "luxury", "travel", "donation", "gambling", "electronics", "clothes", "sports", "gift"}

@dataclass
class UserProfile:
    name: str
    segment_key: str
    mood: str
    pay_cycle: Dict[str, Any]
    predispositions: Dict[str, float] = field(default_factory=dict)
    base_balance: float = 1500.0

@dataclass
class SavingPlan:
    plan_id: str
    name: str
    total: float
    start_day: int
    due_day: int
    frequency: str
    contributed: float = 0.0
    def remaining(self) -> float:
        return max(self.total - self.contributed, 0.0)

def scenario_dict(name: str, scenario_type: str, tags: List[str], description: str, amount_spec: Dict[str, Any], base_daily_prob: float = 0.0, deterministic: bool = False, schedule: Optional[Dict[str, Any]] = None, cooldown_days: int = 0, triggers: Optional[List[Dict[str, Any]]] = None, fixed_id: Optional[str] = None) -> Dict[str, Any]:
    scn_id = fixed_id if fixed_id else uid("scn")
    return {"id": scn_id, "name": name, "type": scenario_type, "tags": tags, "description": description, "amount": amount_spec, "base_daily_prob": base_daily_prob, "deterministic": deterministic, "schedule": schedule, "cooldown_days": cooldown_days, "triggers": triggers or []}

def build_default_catalog() -> List[Dict[str, Any]]:
    scenarios: List[Dict[str, Any]] = []
    scenarios.append(scenario_dict("Paycheck","income",["salary","recurring"],"Regular salary paycheck determined by user's pay cycle.",{"dist":"fixed","value":2000},deterministic=True,schedule={"type":"pay_cycle"}))
    bills_monthly = [("Rent",["rent","housing"],1200),("Mortgage",["mortgage","housing"],1800),("Electricity Bill",["utilities"],80),("Water Bill",["utilities"],40),("Gas Utility",["utilities"],60),("Internet Plan",["internet","utilities"],60),("Mobile Phone Plan",["mobile","utilities"],70),("Car Insurance",["insurance","car"],120),("Health Insurance Premium",["insurance","healthcare"],350),("Renter's Insurance",["insurance","housing"],18),("Homeowner's Insurance",["insurance","housing"],95),("Public Transit Pass",["public_transit","transport"],90),("Parking Permit",["car","transport"],60),("Gym Membership",["subscriptions","fitness"],35),("Cloud Storage 2TB",["subscriptions"],10),("Productivity Software",["subscriptions"],12),("VPN Subscription",["subscriptions"],8),("News Subscription",["subscriptions"],9),("Streaming Video",["subscriptions","entertainment"],12),("Music Streaming",["subscriptions","entertainment"],10),("Coding Platform Pro",["subscriptions","education"],20),("Credit Card Minimum Payment",["debt"],45),("Student Loan Payment",["debt","student_loan"],220),("Daycare / Childcare",["childcare"],750),("Storage Unit",["housing","fees"],120)]
    for i,(nm,tags,avg) in enumerate(bills_monthly, start=1):
        scenarios.append(scenario_dict(nm,"bill",tags+["recurring"],f"Recurring monthly bill: {nm}.",{"dist":"lognormal","mean":avg,"sigma":avg*0.2,"min":max(avg*0.5,5.0)},deterministic=True,schedule={"type":"every_n_days","n":30,"offset":i%30}))
    weekly = [("Groceries",["groceries"],95),("Fuel Refill",["fuel","car","transport"],50)]
    for i,(nm,tags,mean_amt) in enumerate(weekly, start=1):
        scenarios.append(scenario_dict(nm,"expense",tags+["recurring"],f"Regular weekly spend on {nm.lower()}.",{"dist":"lognormal","mean":mean_amt,"sigma":mean_amt*0.4,"min":10.0},deterministic=True,schedule={"type":"every_n_days","n":7,"offset":i%7}))
    day_to_day=[("Coffee Shop",["dining","leisure","convenience"],{"dist":"choice","options":[4,6,8,10]},0.22,0),("Lunch Out",["dining","leisure"],{"dist":"uniform","low":9,"high":18},0.18,0),("Dinner Out",["dining","leisure"],{"dist":"uniform","low":15,"high":35},0.12,1),("Ride-share Trip",["transport","convenience"],{"dist":"uniform","low":8,"high":35},0.10,0),("Movie Night",["entertainment","leisure"],{"dist":"uniform","low":12,"high":45},0.05,3),("Streaming Movie Rental",["entertainment","leisure"],{"dist":"choice","options":[4,6]},0.06,1),("Clothes Shopping",["shopping","clothes"],{"dist":"lognormal","mean":65,"sigma":50,"min":15},0.03,7),("Shoe Shopping",["shopping","clothes"],{"dist":"lognormal","mean":85,"sigma":60,"min":25},0.02,14),("Electronics Accessory",["shopping","electronics"],{"dist":"uniform","low":15,"high":90},0.03,7),("Concert Ticket",["entertainment","leisure","social"],{"dist":"lognormal","mean":80,"sigma":60,"min":25},0.01,20),("Sports Event",["entertainment","sports","social"],{"dist":"lognormal","mean":85,"sigma":65,"min":25},0.01,20),("Bar / Night Out",["leisure","social","alcohol"],{"dist":"uniform","low":20,"high":80},0.05,2),("Home Cleaning Service",["convenience"],{"dist":"lognormal","mean":120,"sigma":60,"min":60},0.01,14)]
    for nm,tags,amt,p,cd in day_to_day:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} discretionary spend.",amt,base_daily_prob=p,cooldown_days=cd))
    emergencies=[("Parking Ticket",["fines","fees"],{"dist":"choice","options":[45,65,90]},0.01,30),("Speeding Ticket",["fines","fees"],{"dist":"choice","options":[120,180,240]},0.004,60),("Car Repair",["car","emergency"],{"dist":"lognormal","mean":450,"sigma":250,"min":150},0.006,60),("Home Repair",["home_improvement","emergency"],{"dist":"lognormal","mean":600,"sigma":400,"min":150},0.004,60),("Urgent Care Visit",["healthcare","emergency"],{"dist":"lognormal","mean":180,"sigma":120,"min":50},0.006,30),("Vet Emergency",["pet","emergency"],{"dist":"lognormal","mean":350,"sigma":200,"min":100},0.003,90),("Overdraft Fee",["fees"],{"dist":"fixed","value":35},0.005,10),("Bank Account Fee",["fees"],{"dist":"choice","options":[5,10,15]},0.01,10),("Credit Card Late Fee",["fees","debt"],{"dist":"choice","options":[25,35,40]},0.004,30)]
    for nm,tags,amt,p,cd in emergencies:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} unexpected expense.",amt,base_daily_prob=p,cooldown_days=cd))
    donations=[("Charity Donation",["donation"],{"dist":"choice","options":[10,25,50,100]},0.02,7),("Crowdfunding Support",["donation","social"],{"dist":"choice","options":[10,20,50]},0.015,7),("Birthday Gift for Friend",["gift","social"],{"dist":"uniform","low":20,"high":80},0.02,20),("Wedding Gift",["gift","social"],{"dist":"uniform","low":75,"high":200},0.006,90),("Holiday Gifts Shopping",["gift","holiday"],{"dist":"lognormal","mean":300,"sigma":150,"min":50},0.003,120)]
    for nm,tags,amt,p,cd in donations:
        scenarios.append(scenario_dict(nm,"donation" if "donation" in tags else "expense",tags,f"{nm} discretionary outflow.",amt,base_daily_prob=p,cooldown_days=cd))
    incomes=[("Side Gig Payout",["gig_income"],{"dist":"lognormal","mean":120,"sigma":80,"min":40},0.05,0),("Freelance Invoice Paid",["freelance_income"],{"dist":"lognormal","mean":600,"sigma":350,"min":150},0.02,7),("Cash Gift from Family",["windfall"],{"dist":"choice","options":[20,50,100,200]},0.008,30),("Money from Friend",["windfall","social"],{"dist":"choice","options":[10,20,50]},0.02,7),("Tax Refund",["tax","windfall"],{"dist":"lognormal","mean":900,"sigma":400,"min":200},0.001,365),("Performance Bonus",["bonus","windfall"],{"dist":"lognormal","mean":1500,"sigma":700,"min":400},0.002,180),("Dividend Income",["investment_income","investment"],{"dist":"choice","options":[10,25,40]},0.02,20),("Marketplace Sale",["windfall"],{"dist":"lognormal","mean":85,"sigma":50,"min":20},0.02,5)]
    for nm,tags,amt,p,cd in incomes:
        scenarios.append(scenario_dict(nm,"income",tags,f"{nm} received.",amt,base_daily_prob=p,cooldown_days=cd))
    invest_debt=[("Stock Purchase",["investment"],{"dist":"lognormal","mean":250,"sigma":150,"min":50},0.02,3),("Crypto Purchase",["investment"],{"dist":"lognormal","mean":150,"sigma":120,"min":20},0.015,3),("Savings Transfer",["savings"],{"dist":"percent_of_pay","pct":0.1},0.03,2),("Extra Credit Card Payment",["debt"],{"dist":"lognormal","mean":120,"sigma":70,"min":25},0.02,5),("Student Loan Extra Payment",["debt","student_loan"],{"dist":"lognormal","mean":200,"sigma":120,"min":50},0.008,10)]
    for nm,tags,amt,p,cd in invest_debt:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} discretionary outflow.",amt,base_daily_prob=p,cooldown_days=cd))
    lottery_buy = scenario_dict("Buy Lottery Ticket","lottery",["gambling"],"Purchase a lottery ticket.",{"dist":"fixed","value":2},base_daily_prob=0.03,cooldown_days=0,triggers=[{"spawn":"lottery_result","after_days":1,"prob":1.0}])
    scenarios.append(lottery_buy)
    lottery_result = scenario_dict("Lottery Result","income",["gambling","windfall"],"Lottery outcome (usually $0; small chance of win).",{"dist":"choice","options":[0]},base_daily_prob=0.0,deterministic=False,fixed_id="lottery_result")
    scenarios.append(lottery_result)
    saving_goals=[("Start Emergency Fund Pledge","Build a $500 emergency fund in 60 days.",500,60,0.01,["savings"]),("Save for Vacation","Save $1,200 for a trip in 120 days.",1200,120,0.008,["savings","travel"]),("Save for New Laptop","Save $1,000 for a laptop in 90 days.",1000,90,0.009,["savings","electronics"]),("Holiday Gifts Pledge","Save $800 for holiday gifts in 90 days.",800,90,0.006,["savings","holiday","gift"])]
    for nm,desc,total,days,p,tags in saving_goals:
        scenarios.append(scenario_dict(nm,"saving_pledge",tags,desc,{"dist":"fixed","value":total},base_daily_prob=p,cooldown_days=45,triggers=[{"spawn":"saving_contribution","after_days":1,"prob":1.0,"data":{"frequency":"weekly"}}]))
    saving_contrib = scenario_dict("Saving Plan Contribution","expense",["savings"],"Contribution toward an active saving pledge.",{"dist":"choice","options":[0]},base_daily_prob=0.0,deterministic=False,fixed_id="saving_contribution")
    scenarios.append(saving_contrib)
    travel=[("Weekend Getaway Booking",["travel","leisure"],{"dist":"lognormal","mean":350,"sigma":200,"min":120},0.006,45),("Flight Ticket Purchase",["travel"],{"dist":"lognormal","mean":420,"sigma":250,"min":150},0.004,60),("Hotel Booking",["travel"],{"dist":"lognormal","mean":300,"sigma":180,"min":120},0.004,45)]
    for nm,tags,amt,p,cd in travel:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} planned spend.",amt,base_daily_prob=p,cooldown_days=cd))
    big_buys=[("Appliance Replacement",["home_improvement"],{"dist":"lognormal","mean":700,"sigma":450,"min":200},0.003,180),("Furniture Purchase",["home_improvement"],{"dist":"lognormal","mean":550,"sigma":300,"min":200},0.004,120),("Phone Upgrade",["electronics"],{"dist":"lognormal","mean":900,"sigma":300,"min":400},0.003,365),("Laptop Upgrade",["electronics"],{"dist":"lognormal","mean":1200,"sigma":400,"min":500},0.002,365),("Television Upgrade",["electronics"],{"dist":"lognormal","mean":800,"sigma":300,"min":300},0.002,270)]
    for nm,tags,amt,p,cd in big_buys:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} large purchase.",amt,base_daily_prob=p,cooldown_days=cd))
    education=[("Course Enrollment Fee",["education"],{"dist":"lognormal","mean":250,"sigma":120,"min":80},0.01,60),("Exam Fee",["education"],{"dist":"choice","options":[60,100,200]},0.008,90),("Textbook Purchase",["education"],{"dist":"lognormal","mean":120,"sigma":60,"min":40},0.015,30)]
    for nm,tags,amt,p,cd in education:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} academic cost.",amt,base_daily_prob=p,cooldown_days=cd))
    health=[("Dental Cleaning Copay",["healthcare"],{"dist":"choice","options":[20,40,60]},0.01,180),("Medication Refill",["healthcare"],{"dist":"lognormal","mean":35,"sigma":20,"min":10},0.03,25),("New Glasses / Contacts",["healthcare"],{"dist":"lognormal","mean":180,"sigma":120,"min":60},0.006,365),("Therapy Session Copay",["healthcare"],{"dist":"uniform","low":20,"high":60},0.01,14),("Gym Day Pass",["fitness","leisure"],{"dist":"choice","options":[10,15,20]},0.03,3)]
    for nm,tags,amt,p,cd in health:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm} health/wellness expense.",amt,base_daily_prob=p,cooldown_days=cd))
    moving=[("Security Deposit",["housing"],{"dist":"lognormal","mean":1200,"sigma":500,"min":500},0.001,365),("Moving Truck Rental",["housing","fees"],{"dist":"lognormal","mean":200,"sigma":120,"min":80},0.002,365),("Deposit Returned",["windfall","housing"],{"dist":"lognormal","mean":900,"sigma":350,"min":200},0.001,365)]
    for nm,tags,amt,p,cd in moving:
        scenarios.append(scenario_dict(nm,"income" if "Returned" in nm else "expense",tags,f"{nm}.",amt,base_daily_prob=p,cooldown_days=cd))
    gov=[("Driver License Renewal",["fees"],{"dist":"choice","options":[20,35,50]},0.001,365),("Passport Fee",["fees"],{"dist":"choice","options":[110,140,180]},0.0007,365),("Tax Filing Service",["fees","tax"],{"dist":"choice","options":[50,100,200]},0.002,365),("Library Late Fee",["fees"],{"dist":"choice","options":[5,10,15]},0.01,14)]
    for nm,tags,amt,p,cd in gov:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm}.",amt,base_daily_prob=p,cooldown_days=cd))
    returns=[("Return Item for Refund",["refund"],{"dist":"lognormal","mean":60,"sigma":40,"min":10},0.01,30),("Mail-in Rebate",["rebate"],{"dist":"choice","options":[10,20,50]},0.004,120),("Credit Card Cashback",["cashback"],{"dist":"choice","options":[5,10,25]},0.05,14)]
    for nm,tags,amt,p,cd in returns:
        scenarios.append(scenario_dict(nm,"income",tags,f"{nm}.",amt,base_daily_prob=p,cooldown_days=cd))
    social=[("Host Dinner at Home",["leisure","social"],{"dist":"lognormal","mean":85,"sigma":50,"min":25},0.01,20),("Weekend Road Trip",["travel","social"],{"dist":"lognormal","mean":200,"sigma":120,"min":80},0.006,30),("Join a Club / Association",["subscriptions","social"],{"dist":"choice","options":[10,20,50]},0.005,180)]
    for nm,tags,amt,p,cd in social:
        scenarios.append(scenario_dict(nm,"expense",tags,f"{nm}.",amt,base_daily_prob=p,cooldown_days=cd))

    scenarios.append(scenario_dict("Deferred Payment Due","bill",["fees","debt"],"Deferred payment scheduled by player choice.",{"dist":"fixed","value":0.0},deterministic=False,fixed_id="deferred_payment"))
    scenarios.append(scenario_dict("Late Fee","expense",["fees"],"Generic late fee incurred by skipping or deferring obligations.",{"dist":"choice","options":[15,25,35,45]},deterministic=False,fixed_id="late_fee_generic"))
    return scenarios

def load_catalog_from_folder(folder: str) -> List[Dict[str, Any]]:
    p = Path(folder); scenarios: List[Dict[str, Any]] = []
    for f in p.glob("*.json"):
        with open(f, "r") as fh: scenarios.append(json.load(fh))
    return scenarios

class ScenarioSelectorChoices:
    def __init__(self, catalog: List[Dict[str, Any]]):
        needed = {"saving_contribution", "lottery_result", "deferred_payment", "late_fee_generic"}
        have_ids = {c["id"] for c in catalog}
        if not needed.issubset(have_ids):
            base = build_default_catalog(); base_by_id = {c["id"]: c for c in base}
            for nid in needed:
                if nid not in have_ids: catalog.append(base_by_id[nid])
        self.catalog = catalog
        self.by_id = {c["id"]: c for c in catalog}
        self.history: List[Dict[str, Any]] = []
        self.pending_offers: Dict[int, List[Dict[str, Any]]] = {}
        self.active_saving_plans: List[SavingPlan] = []
        self.delayed_events: Dict[int, List[Dict[str, Any]]] = {}
        self.day = 0; self.balance = 0.0; self.last_pay_amount = 2000.0
        self.user: Optional[UserProfile] = None

    # ---- helpers
    def is_scheduled_today(self, scn: Dict[str, Any], user: UserProfile, day: int) -> bool:
        sched = scn.get("schedule")
        if not sched:
            return False
        stype = sched.get("type")
        if stype == "every_n_days":
            n = int(sched.get("n", 30)); offset = int(sched.get("offset", 0))
            return (day - offset) % n == 0 and day >= offset
        if stype == "pay_cycle":
            cycle = user.pay_cycle.copy(); ctype = cycle.get("type", "biweekly"); start = int(cycle.get("start_day", 1))
            if ctype == "weekly": n = 7
            elif ctype == "biweekly": n = 14
            elif ctype == "semimonthly": return day == start or (day - start) % 15 == 0
            else: n = 30
            return day >= start and (day - start) % n == 0
        return False

    def occurred_within(self, scn_name: str, days: int, today: int) -> bool:
        if days <= 0: return False
        for ev in reversed(self.history):
            if ev["name"] == scn_name and today - ev["day"] <= days: return True
            if today - ev["day"] > days: break
        return False

    def tag_factor(self, tags: List[str], mapping: Dict[str, float]) -> float:
        return geometric_mean([mapping.get(t, 1.0) for t in tags])

    def compute_probability(self, scn: Dict[str, Any], user: UserProfile, today: int) -> Tuple[float, Dict[str, float]]:
        if scn.get("deterministic"):
            return 0.0, {"base": 0.0, "segment": 1.0, "mood": 1.0, "predisposition": 1.0, "balance": 1.0, "cooldown": 1.0}
        base = scn.get("base_daily_prob", 0.0)
        seg_map = SEGMENTS[user.segment_key]["tag_weights"]
        segment_factor = self.tag_factor(scn.get("tags", []), seg_map)
        mood_map = MOODS.get(user.mood, {})
        mood_factor = self.tag_factor(scn.get("tags", []), mood_map)
        predisposition_factor = 1.0
        for k, v in user.predispositions.items():
            if k in scn.get("tags", []) or k.lower() in scn["name"].lower().replace(" ", "_"):
                predisposition_factor *= float(v)
        balance_factor = 1.0
        if self.balance < 200.0 and any(t in DISCRETIONARY_TAGS for t in scn.get("tags", [])): balance_factor = 0.5
        if self.balance < 0.0 and any(t in DISCRETIONARY_TAGS for t in scn.get("tags", [])): balance_factor = 0.2
        cooldown_days = int(scn.get("cooldown_days", 0))
        cooldown_factor = 0.0 if self.occurred_within(scn["name"], cooldown_days, today) else 1.0
        p = min(max(base * segment_factor * mood_factor * predisposition_factor * balance_factor * cooldown_factor, 0.0), 0.95)
        details = {"base": base, "segment": segment_factor, "mood": mood_factor, "predisposition": predisposition_factor, "balance": balance_factor, "cooldown": cooldown_factor}
        return p, details

    def draw_amount_signed(self, scn: Dict[str, Any], user: UserProfile) -> float:
        ctx = {"last_pay_amount": self.last_pay_amount, "default_pay_amount": user.pay_cycle.get("amount", 2000.0)}
        amt = draw_amount(scn["amount"], ctx); sign = 1.0 if scn["type"] == "income" else -1.0
        return float(sign * amt)

    def instantiate_event(self, scn: Dict[str, Any], day: int, user: Optional[UserProfile], override_amount: Optional[float] = None, extra_desc: str = "") -> Dict[str, Any]:
        amount_signed = override_amount if override_amount is not None else self.draw_amount_signed(scn, user if user else self.user)
        return {"id": uid("ev"), "day": day, "scenario_id": scn["id"], "name": scn["name"], "type": scn["type"], "tags": scn.get("tags", []), "deterministic": scn.get("deterministic", False), "amount": float(amount_signed), "description": (scn.get("description", "") + (" " + extra_desc if extra_desc else "")).strip()}

    # ---- Option generation per scenario type ----
    def build_options(self, scn: Dict[str, Any], proposed_amount: float) -> List[Dict[str, Any]]:
        t = scn["type"]; opts: List[Dict[str, Any]] = []
        def schedule(spawn: str, after_days: int, prob: float = 1.0, override_amount: Optional[float] = None, extra_desc: str = ""):
            payload = {"spawn": spawn, "after_days": after_days, "prob": prob, "data": {}}
            if override_amount is not None: payload["data"]["override_amount"] = float(override_amount)
            if extra_desc: payload["data"]["extra_desc"] = extra_desc
            return payload

        if t == "bill":
            amt = proposed_amount
            opts = [
                {"code":"pay_now","label":"Pay now","amount_now": amt},
                {"code":"pay_partial","label":"Pay 50% now, rest later (+5%)","amount_now": amt*0.5,"triggers":[schedule("deferred_payment",3,1.0,amt*0.5*1.05,"Deferred remainder +5%")]},
                {"code":"skip","label":"Skip (risk late fee)","amount_now": 0.0,"triggers":[schedule("late_fee_generic",5,0.9,-random.choice([15,25,35,45]),"Late fee")]}]
        elif t == "expense":
            amt = proposed_amount
            opts = [
                {"code":"skip","label":"Skip","amount_now": 0.0},
                {"code":"budget","label":"Budget option (~50%)","amount_now": amt*0.5},
                {"code":"regular","label":"Regular","amount_now": amt},
                {"code":"splurge","label":"Splurge (~150%)","amount_now": amt*1.5},
            ]
        elif t == "donation":
            base = max(abs(proposed_amount), 10.0)
            opts = [
                {"code":"skip","label":"Skip","amount_now": 0.0},
                {"code":"small","label":"Small donation","amount_now": -min(base*0.5, 50.0)},
                {"code":"regular","label":"Regular donation","amount_now": -base},
                {"code":"large","label":"Large donation","amount_now": -min(base*2.0, 200.0)},
            ]
        elif t == "income":
            amt = proposed_amount
            opts = [
                {"code":"accept","label":"Accept now","amount_now": amt},
                {"code":"delay_1d","label":"Delay to tomorrow","amount_now": 0.0,"triggers":[schedule(scn["id"],1,1.0,amt,"Delayed income")]},
                {"code":"decline","label":"Decline","amount_now": 0.0},
            ]
        elif t == "saving_pledge":
            total = scn["amount"].get("value", 500.0)
            opts = [
                {"code":"start","label":f"Start pledge (${int(total)})","amount_now": 0.0,"effects":{"saving_pledge":{"total":total}}},
                {"code":"start_smaller","label":f"Start smaller pledge (${int(total*0.8)})","amount_now": 0.0,"effects":{"saving_pledge":{"total":total*0.8}}},
                {"code":"start_bigger","label":f"Start larger pledge (${int(total*1.2)})","amount_now": 0.0,"effects":{"saving_pledge":{"total":total*1.2}}},
                {"code":"decline","label":"Decline pledge","amount_now": 0.0},
            ]
        elif t == "lottery":
            ticket_cost = -abs(scn["amount"].get("value", 2.0))
            opts = [
                {"code":"skip","label":"Skip","amount_now": 0.0},
                {"code":"buy_1","label":"Buy 1 ticket","amount_now": ticket_cost, "triggers":[schedule("lottery_result",1)]},
                {"code":"buy_5","label":"Buy 5 tickets","amount_now": ticket_cost*5, "triggers":[schedule("lottery_result",1), schedule("lottery_result",1), schedule("lottery_result",1), schedule("lottery_result",1), schedule("lottery_result",1)]},
            ]
        else:
            amt = proposed_amount
            if amt >= 0:
                opts = [
                    {"code":"accept","label":"Accept","amount_now": amt},
                    {"code":"delay","label":"Delay by 1 day","amount_now": 0.0,"triggers":[schedule(scn["id"],1,1.0,amt,"Delayed")]},
                    {"code":"decline","label":"Decline","amount_now": 0.0},
                ]
            else:
                opts = [{"code":"skip","label":"Skip","amount_now": 0.0}, {"code":"regular","label":"Proceed","amount_now": amt}]
        for o in opts: o["amount_now"] = float(round(o["amount_now"], 2))
        return opts

    def schedule_trigger(self, today: int, trig: Dict[str, Any], source_event: Dict[str, Any]) -> None:
        import random as _r
        if _r.random() > float(trig.get("prob", 1.0)): return
        due = today + int(trig.get("after_days", 1))
        payload = {"spawn": trig.get("spawn"), "data": trig.get("data", {}), "source_event_id": source_event.get("id")}
        self.delayed_events.setdefault(due, []).append(payload)

    def realize_delayed(self, today: int, user: UserProfile) -> List[Dict[str, Any]]:
        realized: List[Dict[str, Any]] = []
        payloads = self.delayed_events.pop(today, [])
        for p in payloads:
            spawn_id = p.get("spawn"); data = p.get("data", {})
            override_amount = data.get("override_amount"); extra_desc = data.get("extra_desc","")
            if spawn_id == "lottery_result":
                r = random.random()
                if r < 0.921: amount = 0.0; desc = "Lottery result: no win."
                elif r < 0.921 + 0.079: amount = float(np.random.uniform(5, 50)); desc = "Lottery result: small win."
                else: amount = float(np.random.uniform(1000, 10000)); desc = "Lottery result: big win!"
                scn = self.by_id["lottery_result"]
                ev = self.instantiate_event(scn, today, user, override_amount=amount, extra_desc=desc)
                realized.append(ev)
            else:
                scn = self.by_id.get(spawn_id)
                if scn is not None:
                    ev = self.instantiate_event(scn, today, user, override_amount=override_amount, extra_desc=extra_desc)
                    realized.append(ev)
        return realized

    def add_saving_plan(self, name: str, total: float, start_day: int, due_in_days: int, frequency: str = "weekly") -> SavingPlan:
        plan = SavingPlan(plan_id=uid("plan"), name=name, total=float(total), start_day=int(start_day), due_day=int(start_day + due_in_days), frequency=frequency)
        self.active_saving_plans.append(plan); return plan

    def contributions_today(self, today: int) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for plan in list(self.active_saving_plans):
            if plan.remaining() <= 0.0 or today > plan.due_day: continue
            due = (plan.frequency == "daily") or ((today - plan.start_day) >= 0 and (today - plan.start_day) % 7 == 0)
            if not due: continue
            remaining_days = max(plan.due_day - today, 1)
            increments = 1 if plan.frequency == "daily" else max(1, remaining_days // 7)
            contrib = max(plan.remaining() / increments, 5.0)
            contrib = float(min(contrib, plan.remaining()))
            scn = self.by_id["saving_contribution"]
            ev = self.instantiate_event(scn, today, self.user, override_amount=-contrib, extra_desc=f"Auto-contribution to '{plan.name}'")
            plan.contributed += contrib; out.append(ev)
        return out

    def propose_day(self, user: UserProfile, day: int, max_probabilistic: int = 6) -> List[Dict[str, Any]]:
        self.user = user
        offers: List[Dict[str, Any]] = []

        # Forced delayed events (no options)
        realized = self.realize_delayed(day, user)
        for ev in realized:
            offer = {"offer_id": uid("offer"), "day": day, "scenario_id": ev["scenario_id"], "name": ev["name"], "type": ev["type"], "tags": ev.get("tags", []), "deterministic": True, "proposed_amount": ev["amount"], "probability": 1.0, "prob_details": {"forced":"triggered"}, "options": [{"code":"forced","label":"Forced","amount_now": ev["amount"]}], "internal_forced_event": ev}
            offers.append(offer)

        # Deterministic schedules
        for scn in self.catalog:
            if scn.get("deterministic") and self.is_scheduled_today(scn, user, day):
                if scn["name"] == "Paycheck":
                    amt = float(user.pay_cycle.get("amount", 2000.0)); self.last_pay_amount = amt
                    ev = self.instantiate_event(scn, day, user, override_amount=amt)
                else:
                    ev = self.instantiate_event(scn, day, user)
                options = self.build_options(scn, ev["amount"])
                offer = {"offer_id": uid("offer"), "day": day, "scenario_id": scn["id"], "name": scn["name"], "type": scn["type"], "tags": scn.get("tags", []), "deterministic": True, "proposed_amount": ev["amount"], "probability": 1.0, "prob_details": {"deterministic":"schedule"}, "options": options}
                offers.append(offer)

        # Probabilistic
        prob_pool: List[Tuple[Dict[str, Any], float, Dict[str, float]]] = []
        for scn in self.catalog:
            if scn.get("deterministic"): continue
            p, details = self.compute_probability(scn, user, day)
            if p > 0.0: prob_pool.append((scn, p, details))
        prob_pool.sort(key=lambda t: t[1], reverse=True)

        chosen = 0
        for scn, p, details in prob_pool:
            if chosen >= max_probabilistic: break
            if random.random() < p:
                ev = self.instantiate_event(scn, day, user)
                options = self.build_options(scn, ev["amount"])
                offer = {"offer_id": uid("offer"), "day": day, "scenario_id": scn["id"], "name": scn["name"], "type": scn["type"], "tags": scn.get("tags", []), "deterministic": False, "proposed_amount": ev["amount"], "probability": p, "prob_details": details, "options": options}
                offers.append(offer); chosen += 1

        # Saving plan auto-contributions as forced offers
        for ev in self.contributions_today(day):
            offer = {"offer_id": uid("offer"), "day": day, "scenario_id": ev["scenario_id"], "name": ev["name"], "type": ev["type"], "tags": ev.get("tags", []), "deterministic": True, "proposed_amount": ev["amount"], "probability": 1.0, "prob_details": {"plan":"auto"}, "options": [{"code":"forced","label":"Scheduled contribution","amount_now": ev["amount"]}], "internal_forced_event": ev}
            offers.append(offer)

        self.pending_offers[day] = offers
        return offers

    def commit_day(self, day: int, choices: Dict[str, str]) -> List[Dict[str, Any]]:
        offers = self.pending_offers.pop(day, [])
        committed: List[Dict[str, Any]] = []
        for offer in offers:
            opt_code = choices.get(offer["offer_id"], offer["options"][0]["code"])
            if opt_code == "forced" and "internal_forced_event" in offer:
                ev = offer["internal_forced_event"]; self.balance += ev["amount"]
                ev["chosen_option"] = "forced"; ev["proposed_amount"] = offer["proposed_amount"]; ev["probability"] = offer["probability"]; ev["prob_details"] = offer["prob_details"]
                committed.append(ev); self.history.append(ev); continue

            picked = next((o for o in offer["options"] if o["code"] == opt_code), offer["options"][0])
            ev = {"id": uid("ev"), "day": day, "scenario_id": offer["scenario_id"], "name": offer["name"], "type": offer["type"], "tags": offer.get("tags", []), "deterministic": offer.get("deterministic", False), "proposed_amount": float(offer["proposed_amount"]), "amount": float(picked["amount_now"]), "chosen_option": picked["code"], "chosen_label": picked["label"], "probability": offer.get("probability", 1.0), "prob_details": offer.get("prob_details", {})}
            self.balance += ev["amount"]
            if ev["name"] == "Paycheck": self.last_pay_amount = ev["amount"]
            committed.append(ev); self.history.append(ev)

            for trig in picked.get("triggers", []): self.schedule_trigger(day, trig, ev)
            effects = picked.get("effects", {})
            if "saving_pledge" in effects:
                total = float(effects["saving_pledge"].get("total", 500.0))
                scn_desc = ""  # could parse days from scenario description; default 90
                days = 90
                self.add_saving_plan(ev["name"], total, day, days, frequency="weekly")
        return committed

    # Simple policy runner (for testing)
    def run_with_policy(self, user: UserProfile, days: int, policy_fn=None) -> pd.DataFrame:
        def default_policy(offer): 
            t = offer["type"]; tags = set(offer.get("tags", []))
            def has(code): return any(o["code"] == code for o in offer["options"])
            if t == "income": return "accept" if has("accept") else offer["options"][0]["code"]
            if t == "bill": return "pay_now" if has("pay_now") else ("pay_full" if has("pay_full") else offer["options"][0]["code"])
            if t == "donation": return "skip"
            if t == "saving_pledge": return "start" if has("start") else "decline"
            if t == "lottery": return "skip"
            if t == "expense": return "budget" if has("budget") else (offer["options"][0]["code"])
            return offer["options"][0]["code"]

        policy = policy_fn or (lambda s, u, d, off: {o["offer_id"]: default_policy(o) for o in off})
        self.user = user; self.day = 0; self.balance = user.base_balance; self.history = []; self.active_saving_plans = []; self.delayed_events = {}; self.last_pay_amount = user.pay_cycle.get("amount", 2000.0)

        rows: List[Dict[str, Any]] = []
        for d in range(1, days + 1):
            offers = self.propose_day(user, d)
            decision_map = policy(self, user, d, offers)
            committed = self.commit_day(d, decision_map)
            for ev in committed:
                rows.append({"day": ev["day"], "name": ev["name"], "type": ev["type"], "proposed": round(ev.get("proposed_amount", ev["amount"]), 2), "choice": ev.get("chosen_option","forced"), "amount": round(ev["amount"], 2), "balance_after": round(self.balance, 2)})
        return pd.DataFrame(rows)
