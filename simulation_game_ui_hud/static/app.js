let SESSION_ID = null;
let CURRENT_OFFERS = [];
let CURRENT_DAY = 1;

// HUD state (client-only; computed from committed events)
const HUD = {
  health: 70,
  accounts: { checking: 0, savings: 0, invest: 0 },
  achievements: {
    firstPay: false,
    rentOnTime: false,
    pledge: false,
    debtExtra: false,
    saver500: false,
  },
};

// -------- Utilities --------
async function api(path, method="GET", body=null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const txt = await res.text(); throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

const money = (n) => `$${Number(n).toFixed(2)}`;
function fmtSigned(n) {
  const s = Number(n).toFixed(2);
  if (n > 0) return `<span class="amount-pos">+${money(n)}</span>`;
  if (n < 0) return `<span class="amount-neg">${money(n)}</span>`;
  return `<span class="amount-zero">${money(n)}</span>`;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const isDisc = (tags) => (tags || []).some(t => ["leisure","entertainment","shopping","luxury","travel","donation","gambling","electronics","clothes","sports","gift"].includes(t));
const monthFromDay = (d) => `M${Math.floor((Math.max(d,1)-1)/30)+1}`;

// -------- HUD rendering --------
function renderHUD() {
  document.getElementById("hud-month").textContent = monthFromDay(CURRENT_DAY);
  document.getElementById("hud-health-text").textContent = `${Math.round(HUD.health)}/100`;
  const trophies = Object.values(HUD.achievements).filter(Boolean).length;
  document.getElementById("hud-trophies").textContent = `${trophies}/5`;
  document.getElementById("hud-checking").textContent = money(HUD.accounts.checking);
  document.getElementById("hud-savings").textContent  = money(HUD.accounts.savings);
  document.getElementById("hud-invest").textContent   = money(HUD.accounts.invest);
  const w = clamp(HUD.health, 0, 100);
  document.getElementById("hud-healthbar-inner").style.width = `${w}%`;
}

// -------- Offer list rendering (with impact chips) --------
function tagBadge(t) { return `<span class="badge">${t}</span>`; }

function impactForOption(offer, opt) {
  // Predict immediate effect of this option (icons only; not binding)
  const amount = Number(opt.amount_now ?? 0);
  let chips = [];
  // Money impacts (checking by default)
  if (amount !== 0) {
    chips.push({ text: `💵 ${amount>0?'+':''}${money(Math.abs(amount))}`, kind: amount>0? 'good':'bad' });
  }
  // Transfers to savings / investments
  const name = (offer.name || "").toLowerCase();
  if (name.includes("saving plan contribution") || name.includes("savings transfer")) {
    const move = Math.abs(amount);
    if (move > 0) chips.push({ text: `🏦 +${money(move)}`, kind: "good" });
  }
  if (name.includes("stock purchase") || name.includes("crypto purchase")) {
    const move = Math.abs(amount);
    if (move > 0) chips.push({ text: `📈 +${money(move)}`, kind: "good" });
  }
  // Health heuristic
  let dh = 0;
  if (offer.type === "bill") {
    if (opt.code.includes("pay_now")) dh = +1;
    else if (opt.code.includes("pay_partial")) dh = 0;
    else if (opt.code.includes("skip")) dh = -2;
  } else if (offer.type === "income") {
    if (opt.code.includes("accept")) dh = +1;
  } else if (offer.type === "donation") {
    if (opt.code === "small") dh = +0.2;
    if (opt.code === "regular") dh = +0.3;
    if (opt.code === "large") dh = +0.4;
  } else if (offer.type === "lottery") {
    if (opt.code.startsWith("buy")) dh = -0.3;
  } else if (offer.type === "expense" && isDisc(offer.tags)) {
    if (opt.code === "budget") dh = +0.2;
    if (opt.code === "splurge") dh = -0.5;
  }
  if (dh !== 0) chips.push({ text: `❤️ ${dh>0?'+':''}${dh}`, kind: dh>0? "good":"bad" });

  // Triggers warnings (late fee, deferred payment, lottery result)
  const trigs = opt.triggers || [];
  for (const t of trigs) {
    const s = String(t.spawn || "").toLowerCase();
    if (s.includes("late_fee")) chips.push({ text: "⚠️ Late fee risk", kind: "warn" });
    if (s.includes("deferred_payment")) chips.push({ text: "⏭️ Pay later", kind: "warn" });
    if (s.includes("lottery_result")) chips.push({ text: "🎟️ Draw tomorrow", kind: "warn" });
  }
  return chips;
}

function renderOffers(offers) {
  const root = document.getElementById("offers-list");
  root.innerHTML = "";
  if (!offers || offers.length === 0) {
    root.innerHTML = `<div class="small">No offers today. Press Commit to advance.</div>`;
    return;
  }
  for (const off of offers) {
    const tags = (off.tags || []).map(tagBadge).join(" ");
    const amount = off.proposed_amount !== undefined ? fmtSigned(off.proposed_amount) : "";
    const prob = off.deterministic ? "" : `<span class="small">p≈${(off.probability*100).toFixed(1)}%</span>`;

    const opts = (off.options || []).map((o, idx) => {
      const checked = idx === 0 ? "checked" : "";
      const labelRight = (o.amount_now !== undefined) ? fmtSigned(o.amount_now) : "";
      const chips = impactForOption(off, o).map(c => `<span class="chip ${c.kind}">${c.text}</span>`).join(" ");
      return `<div class="option">
        <input type="radio" name="${off.offer_id}" id="${off.offer_id}-${o.code}" value="${o.code}" ${checked} />
        <label for="${off.offer_id}-${o.code}">
          <div class="option-line"><span>${o.label}</span><span>${labelRight}</span></div>
          <div class="chips">${chips}</div>
        </label>
      </div>`;
    }).join("");

    root.insertAdjacentHTML("beforeend", `
      <div class="card">
        <div class="card-header">
          <div class="title">${off.name}</div>
          <div>${amount}</div>
        </div>
        <div class="badges">${tags}</div>
        <div class="small">Type: ${off.type} ${prob}</div>
        <div class="options">${opts}</div>
      </div>`);
  }
}

// -------- Committed + History rendering --------
function renderCommitted(committed) {
  const root = document.getElementById("committed-list");
  root.innerHTML = "";
  if (!committed || committed.length === 0) {
    root.innerHTML = `<div class="small">Nothing committed yet.</div>`;
    return;
  }
  for (const ev of committed) {
    root.insertAdjacentHTML("beforeend", `
      <div class="card">
        <div class="card-header">
          <div class="title">${ev.name}</div>
          <div>${fmtSigned(ev.amount)}</div>
        </div>
        <div class="small">Option: ${ev.chosen_label || ev.chosen_option || "forced"}</div>
      </div>`);
  }
}

async function refreshHistory() {
  if (!SESSION_ID) return;
  const state = await api(`/api/state?session_id=${encodeURIComponent(SESSION_ID)}`);
  const root = document.getElementById("history-list");
  root.innerHTML = "";
  const hist = state.history || [];
  for (const ev of hist.slice().reverse()) {
    root.insertAdjacentHTML("beforeend", `
      <div class="card">
        <div class="card-header">
          <div class="title">${ev.name}</div>
          <div>${fmtSigned(ev.amount)}</div>
        </div>
        <div class="small">Day ${ev.day} • ${ev.type}</div>
      </div>`);
  }
}

// -------- Game flow --------
async function loadMeta() {
  const meta = await api("/api/meta");
  const segSel = document.getElementById("segment-select"); segSel.innerHTML = "";
  for (const [key, v] of Object.entries(meta.segments)) {
    const opt = document.createElement("option");
    opt.value = key; opt.textContent = `${v.name}`;
    segSel.appendChild(opt);
  }
  segSel.value = meta.defaults.segment_key;

  const moodSel = document.getElementById("mood-select"); moodSel.innerHTML = "";
  for (const m of meta.moods) {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    moodSel.appendChild(opt);
  }
  moodSel.value = meta.defaults.mood;
}

async function startGame(form) {
  const data = new FormData(form);
  const payload = {
    name: data.get("name"),
    segment_key: data.get("segment_key"),
    mood: data.get("mood"),
    pay_type: data.get("pay_type"),
    pay_start_day: Number(data.get("pay_start_day")),
    pay_amount: Number(data.get("pay_amount")),
    base_balance: Number(data.get("base_balance")),
    predispositions: {},
  };
  const res = await api("/api/start", "POST", payload);
  SESSION_ID = res.session_id;
  CURRENT_DAY = res.day;
  // Initialize HUD accounts from base balance (all in checking at start)
  HUD.accounts.checking = Number(payload.base_balance);
  HUD.accounts.savings = 0; HUD.accounts.invest = 0;
  HUD.health = 70;
  HUD.achievements = { firstPay:false, rentOnTime:false, pledge:false, debtExtra:false, saver500:false };
  renderHUD();

  CURRENT_OFFERS = res.offers || [];
  renderOffers(CURRENT_OFFERS);
  document.getElementById("committed-list").innerHTML = "";
  await refreshHistory();
}

function gatherChoices() {
  const map = {};
  for (const off of CURRENT_OFFERS) {
    const sel = document.querySelector(`input[name="${off.offer_id}"]:checked`);
    if (sel) map[off.offer_id] = sel.value;
  }
  return map;
}

// Simple autopicker heuristic
function autopickTodayChoices(offers) {
  const decisions = {};
  for (const off of offers) {
    const has = code => (off.options || []).some(o => o.code === code);
    if (off.type === "income") { decisions[off.offer_id] = has("accept") ? "accept" : (off.options[0]?.code || "accept"); continue; }
    if (off.type === "bill") {
      if (has("pay_now")) decisions[off.offer_id] = "pay_now";
      else if (has("pay_partial")) decisions[off.offer_id] = "pay_partial";
      else decisions[off.offer_id] = (off.options[0]?.code || "pay_now"); continue;
    }
    if (off.type === "donation") { decisions[off.offer_id] = "skip"; continue; }
    if (off.type === "saving_pledge") { decisions[off.offer_id] = has("start_smaller") ? "start_smaller" : (has("start") ? "start" : "decline"); continue; }
    if (off.type === "lottery") { decisions[off.offer_id] = "skip"; continue; }
    // generic expense
    decisions[off.offer_id] = has("budget") ? "budget" : (off.options[0]?.code || "regular");
  }
  return decisions;
}

// Apply committed events to HUD state (accounts, health, achievements)
function applyCommittedToHUD(committed) {
  for (const ev of committed) {
    const amt = Number(ev.amount || 0);
    const name = (ev.name || "").toLowerCase();
    const tags = ev.tags || [];

    // default: adjust checking by signed amount
    HUD.accounts.checking += amt;

    // transfers to savings
    if (name.includes("saving plan contribution") || name.includes("savings transfer")) {
      const move = Math.abs(amt);
      HUD.accounts.savings += move;
    }
    // investments
    if (ev.type === "expense" && (name.includes("stock purchase") || name.includes("crypto purchase"))) {
      const move = Math.abs(amt);
      HUD.accounts.invest += move;
    }

    // health delta heuristic
    let dh = 0;
    if (ev.type === "bill") {
      if (String(ev.chosen_option).includes("pay_now") || String(ev.chosen_option).includes("regular")) dh = +1;
      else if (String(ev.chosen_option).includes("skip")) dh = -2;
      else if (String(ev.chosen_option).includes("pay_partial")) dh = 0;
    } else if (ev.name === "Late Fee") {
      dh = -3;
    } else if (ev.type === "income" && amt > 0) {
      dh = +1;
    } else if (name.includes("buy lottery ticket")) {
      dh = -0.3;
    } else if (name.includes("lottery result")) {
      if (amt >= 1000) dh = +10;
      else if (amt > 0) dh = +1;
    } else if (name.includes("saving plan contribution")) {
      dh = +1;
    } else if (ev.type === "expense" && isDisc(tags)) {
      if (String(ev.chosen_option) === "budget") dh = +0.2;
      if (String(ev.chosen_option) === "splurge") dh = -0.5;
    }

    HUD.health = clamp(HUD.health + dh, 0, 100);

    // achievements
    if (!HUD.achievements.firstPay && ev.name === "Paycheck" && amt > 0) HUD.achievements.firstPay = true;
    if (!HUD.achievements.rentOnTime && (ev.name === "Rent" || ev.name === "Mortgage") && (String(ev.chosen_option).includes("pay_now") || String(ev.chosen_option).includes("regular"))) HUD.achievements.rentOnTime = true;
    if (!HUD.achievements.pledge && name.includes("pledge") && String(ev.chosen_option).startsWith("start")) HUD.achievements.pledge = true;
    if (!HUD.achievements.debtExtra && (name.includes("extra credit card") || name.includes("student loan extra"))) HUD.achievements.debtExtra = true;
    if (!HUD.achievements.saver500 && HUD.accounts.savings >= 500) HUD.achievements.saver500 = true;
  }

  // end-of-day stress check
  const net = HUD.accounts.checking + HUD.accounts.savings + HUD.accounts.invest;
  if (net < 0) HUD.health = clamp(HUD.health - 3, 0, 100);
}

async function commitChoices(autopick=false) {
  if (!SESSION_ID) return;
  const choices = autopick ? autopickTodayChoices(CURRENT_OFFERS) : gatherChoices();
  const res = await api("/api/commit", "POST", { session_id: SESSION_ID, choices });
  // Apply to HUD
  applyCommittedToHUD(res.committed || []);
  renderHUD();

  CURRENT_DAY = res.day;
  renderCommitted(res.committed || []);
  CURRENT_OFFERS = res.next_offers || [];
  renderOffers(CURRENT_OFFERS);
  await refreshHistory();
}

function showModal(show) { document.getElementById("modal").classList.toggle("hidden", !show); }

async function main() {
  await loadMeta();
  showModal(true);
  document.getElementById("btn-new-game").addEventListener("click", () => showModal(true));
  document.getElementById("modal-close").addEventListener("click", () => showModal(false));
  document.getElementById("form-start").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await startGame(e.target); showModal(false); } catch (err) { alert(err.message); }
  });
  document.getElementById("btn-commit").addEventListener("click", async () => {
    try { await commitChoices(false); } catch (err) { alert(err.message); }
  });
  document.getElementById("btn-autopick").addEventListener("click", async () => {
    try { await commitChoices(true); } catch (err) { alert(err.message); }
  });
}
main().catch(err => console.error(err));
