import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface UserProfile {
  name: string;
  segment_key: string;
  mood: string;
  pay_cycle: {
    type: string;
    start_day: number;
    amount: number;
  };
  predispositions: Record<string, number>;
  base_balance: number;
}

export interface Scenario {
  id: string;
  name: string;
  type: string;
  tags: string[];
  description: string;
  amount: any;
  base_daily_prob: number;
  deterministic: boolean;
  schedule?: any;
  cooldown_days: number;
  triggers: any[];
}

export interface Choice {
  code: string;
  label: string;
  amount_now: number;
  triggers?: any[];
  effects?: any;
}

export interface Offer {
  offer_id: string;
  day: number;
  scenario_id: string;
  name: string;
  type: string;
  tags: string[];
  deterministic: boolean;
  proposed_amount: number;
  probability: number;
  prob_details: any;
  options: Choice[];
  internal_forced_event?: any;
}

export interface CommittedEvent {
  id: string;
  day: number;
  scenario_id: string;
  name: string;
  type: string;
  tags: string[];
  deterministic: boolean;
  proposed_amount: number;
  amount: number;
  chosen_option: string;
  chosen_label: string;
  probability: number;
  prob_details: any;
}

export interface SavingPlan {
  plan_id: string;
  name: string;
  total: number;
  start_day: number;
  due_day: number;
  frequency: string;
  contributed: number;
}

export interface HUD {
  month: number;
  day_in_month: number;
  health: number;
  trophies: {
    earned: number;
    total: number;
  };
  accounts: {
    checking: number;
    savings: number;
    investments: number;
  };
}

// Constants
const DISCRETIONARY_TAGS = new Set(['leisure', 'entertainment', 'shopping', 'luxury', 'travel', 'donation', 'gambling', 'electronics', 'clothes', 'sports', 'gift']);

const SEGMENTS: Record<string, any> = {
  student_independent: { tag_weights: { tuition: 1.6, education: 1.3, subscriptions: 1.0, groceries: 1.1, rent: 1.1, leisure: 0.9, donation: 0.6, gambling: 0.7, investment: 0.7, salary: 0.9, gig_income: 1.3 } },
  early_career: { tag_weights: { salary: 1.2, gig_income: 1.0, leisure: 1.2, groceries: 1.0, subscriptions: 1.3, donation: 0.9, gambling: 0.9, investment: 0.9, rent: 1.2, transport: 1.1 } },
  mid_career: { tag_weights: { salary: 1.2, investment: 1.2, childcare: 1.4, mortgage: 1.3, insurance: 1.2, subscriptions: 1.1, leisure: 1.0, donation: 1.1, groceries: 1.2, car: 1.2 } },
};

const MOODS: Record<string, Record<string, number>> = {
  optimistic: { investment: 1.2, leisure: 1.1, donation: 1.1, savings: 1.05 },
  pessimistic: { investment: 0.8, leisure: 0.9, savings: 1.1 },
  stressed: { convenience: 1.2, dining: 1.15, leisure: 0.95, savings: 0.95 },
  bored: { leisure: 1.3, entertainment: 1.2, gambling: 1.2, shopping: 1.15 },
  generous: { donation: 1.5, gift: 1.2 },
  frugal: { leisure: 0.8, shopping: 0.85, savings: 1.2 },
};

// Utility functions
function uid(prefix: string): string {
  return `${prefix}_${uuidv4().slice(0, 10)}`;
}

function geometricMean(values: number[]): number {
  if (values.length === 0) return 1.0;
  let prod = 1.0;
  for (const v of values) {
    prod *= Math.max(v, 1e-9);
  }
  return Math.pow(prod, 1.0 / values.length);
}

function lognormalAmount(mean: number, sigma: number, minClip: number = 0.0, maxClip?: number): number {
  const mu = Math.log(Math.max(mean, 1e-6)) - 0.5 * Math.log(1 + (sigma / Math.max(mean, 1e-6)) ** 2);
  const s = Math.sqrt(Math.max(Math.log(1 + (sigma / Math.max(mean, 1e-6)) ** 2), 1e-9));

  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  let sample = Math.exp(mu + s * z);
  if (minClip !== undefined) sample = Math.max(sample, minClip);
  if (maxClip !== undefined) sample = Math.min(sample, maxClip);
  return sample;
}

function drawAmount(spec: any, context: any): number {
  const dist = spec.dist || 'fixed';

  if (dist === 'fixed') {
    return parseFloat(spec.value);
  } else if (dist === 'uniform') {
    return spec.low + Math.random() * (spec.high - spec.low);
  } else if (dist === 'normal') {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const val = spec.mean + spec.sd * z;
    return Math.max(val, spec.min || 0.0);
  } else if (dist === 'lognormal') {
    return lognormalAmount(spec.mean, spec.sigma, spec.min || 0.0, spec.max);
  } else if (dist === 'percent_of_pay') {
    const lastPay = context.last_pay_amount || context.default_pay_amount || 2000.0;
    return Math.abs(lastPay) * parseFloat(spec.pct || 0.2);
  } else if (dist === 'choice') {
    const opts = spec.options;
    const weights = spec.weights || opts.map(() => 1);
    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < opts.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return parseFloat(opts[i]);
    }
    return parseFloat(opts[opts.length - 1]);
  }

  return parseFloat(spec.value || 0.0);
}

// Load scenarios from folder
export function loadCatalog(scenariosPath: string): Scenario[] {
  const scenarios: Scenario[] = [];

  try {
    const files = fs.readdirSync(scenariosPath);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'scenario_index.jsonl') {
        const filePath = path.join(scenariosPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const scenario = JSON.parse(content);
        scenarios.push(scenario);
      }
    }
  } catch (error) {
    console.error('Failed to load scenarios:', error);
  }

  return scenarios;
}

// Scenario Selector with Choices
export class ScenarioSelectorChoices {
  catalog: Scenario[];
  by_id: Record<string, Scenario>;
  history: CommittedEvent[];
  pending_offers: Record<number, Offer[]>;
  active_saving_plans: SavingPlan[];
  delayed_events: Record<number, any[]>;
  day: number;
  balance: number;
  last_pay_amount: number;
  user: UserProfile | null;

  constructor(catalog: Scenario[]) {
    this.catalog = catalog;
    this.by_id = {};
    for (const scn of catalog) {
      this.by_id[scn.id] = scn;
    }
    this.history = [];
    this.pending_offers = {};
    this.active_saving_plans = [];
    this.delayed_events = {};
    this.day = 0;
    this.balance = 0.0;
    this.last_pay_amount = 2000.0;
    this.user = null;
  }

  isScheduledToday(scn: Scenario, user: UserProfile, day: number): boolean {
    const sched = scn.schedule;
    if (!sched) return false;

    const stype = sched.type;
    if (stype === 'every_n_days') {
      const n = parseInt(sched.n || 30);
      const offset = parseInt(sched.offset || 0);
      return (day - offset) % n === 0 && day >= offset;
    }

    if (stype === 'pay_cycle') {
      const cycle = user.pay_cycle;
      const ctype = cycle.type || 'biweekly';
      const start = parseInt(cycle.start_day?.toString() || '1');

      if (ctype === 'weekly') {
        return day >= start && (day - start) % 7 === 0;
      } else if (ctype === 'biweekly') {
        return day >= start && (day - start) % 14 === 0;
      } else if (ctype === 'semimonthly') {
        return day === start || (day - start) % 15 === 0;
      } else { // monthly
        return day >= start && (day - start) % 30 === 0;
      }
    }

    return false;
  }

  occurredWithin(scnName: string, days: number, today: number): boolean {
    if (days <= 0) return false;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const ev = this.history[i];
      if (ev.name === scnName && today - ev.day <= days) return true;
      if (today - ev.day > days) break;
    }
    return false;
  }

  tagFactor(tags: string[], mapping: Record<string, number>): number {
    const values = tags.map(t => mapping[t] || 1.0);
    return geometricMean(values);
  }

  computeProbability(scn: Scenario, user: UserProfile, today: number): { prob: number; details: any } {
    if (scn.deterministic) {
      return { prob: 0.0, details: { base: 0.0, segment: 1.0, mood: 1.0, predisposition: 1.0, balance: 1.0, cooldown: 1.0 } };
    }

    const base = scn.base_daily_prob || 0.0;
    const segMap = SEGMENTS[user.segment_key]?.tag_weights || {};
    const segmentFactor = this.tagFactor(scn.tags, segMap);

    const moodMap = MOODS[user.mood] || {};
    const moodFactor = this.tagFactor(scn.tags, moodMap);

    let predispositionFactor = 1.0;
    for (const [k, v] of Object.entries(user.predispositions)) {
      if (scn.tags.includes(k) || scn.name.toLowerCase().replace(/ /g, '_').includes(k.toLowerCase())) {
        predispositionFactor *= v;
      }
    }

    let balanceFactor = 1.0;
    if (this.balance < 200.0 && scn.tags.some(t => DISCRETIONARY_TAGS.has(t))) {
      balanceFactor = 0.5;
    }
    if (this.balance < 0.0 && scn.tags.some(t => DISCRETIONARY_TAGS.has(t))) {
      balanceFactor = 0.2;
    }

    const cooldownDays = scn.cooldown_days || 0;
    const cooldownFactor = this.occurredWithin(scn.name, cooldownDays, today) ? 0.0 : 1.0;

    const prob = Math.min(Math.max(base * segmentFactor * moodFactor * predispositionFactor * balanceFactor * cooldownFactor, 0.0), 0.95);

    return {
      prob,
      details: {
        base,
        segment: segmentFactor,
        mood: moodFactor,
        predisposition: predispositionFactor,
        balance: balanceFactor,
        cooldown: cooldownFactor,
      },
    };
  }

  drawAmountSigned(scn: Scenario, user: UserProfile): number {
    const ctx = {
      last_pay_amount: this.last_pay_amount,
      default_pay_amount: user.pay_cycle.amount || 2000.0,
    };
    const amt = drawAmount(scn.amount, ctx);
    const sign = scn.type === 'income' ? 1.0 : -1.0;
    return sign * amt;
  }

  instantiateEvent(scn: Scenario, day: number, user: UserProfile, overrideAmount?: number, extraDesc: string = ''): any {
    const amountSigned = overrideAmount !== undefined ? overrideAmount : this.drawAmountSigned(scn, user);
    return {
      id: uid('ev'),
      day,
      scenario_id: scn.id,
      name: scn.name,
      type: scn.type,
      tags: scn.tags || [],
      deterministic: scn.deterministic || false,
      amount: parseFloat(amountSigned.toFixed(2)),
      description: (scn.description + (extraDesc ? ' ' + extraDesc : '')).trim(),
    };
  }

  buildOptions(scn: Scenario, proposedAmount: number): Choice[] {
    const t = scn.type;
    const opts: Choice[] = [];

    const schedule = (spawn: string, afterDays: number, prob: number = 1.0, overrideAmount?: number, extraDesc: string = '') => {
      const payload: any = {
        spawn,
        after_days: afterDays,
        prob,
        data: {},
      };
      if (overrideAmount !== undefined) payload.data.override_amount = overrideAmount;
      if (extraDesc) payload.data.extra_desc = extraDesc;
      return payload;
    };

    if (t === 'bill') {
      const amt = proposedAmount;
      opts.push({ code: 'pay_now', label: 'Pay now', amount_now: amt });
      opts.push({ code: 'pay_partial', label: 'Pay 50% now, rest later (+5%)', amount_now: amt * 0.5, triggers: [schedule('deferred_payment', 3, 1.0, amt * 0.5 * 1.05, 'Deferred remainder +5%')] });
      opts.push({ code: 'skip', label: 'Skip (risk late fee)', amount_now: 0.0, triggers: [schedule('late_fee_generic', 5, 0.9, -[15, 25, 35, 45][Math.floor(Math.random() * 4)], 'Late fee')] });
    } else if (t === 'expense') {
      const amt = proposedAmount;
      opts.push({ code: 'skip', label: 'Skip', amount_now: 0.0 });
      opts.push({ code: 'budget', label: 'Budget option (~50%)', amount_now: amt * 0.5 });
      opts.push({ code: 'regular', label: 'Regular', amount_now: amt });
      opts.push({ code: 'splurge', label: 'Splurge (~150%)', amount_now: amt * 1.5 });
    } else if (t === 'donation') {
      const base = Math.max(Math.abs(proposedAmount), 10.0);
      opts.push({ code: 'skip', label: 'Skip', amount_now: 0.0 });
      opts.push({ code: 'small', label: 'Small donation', amount_now: -Math.min(base * 0.5, 50.0) });
      opts.push({ code: 'regular', label: 'Regular donation', amount_now: -base });
      opts.push({ code: 'large', label: 'Large donation', amount_now: -Math.min(base * 2.0, 200.0) });
    } else if (t === 'income') {
      const amt = proposedAmount;
      opts.push({ code: 'accept', label: 'Accept now', amount_now: amt });
      opts.push({ code: 'delay_1d', label: 'Delay to tomorrow', amount_now: 0.0, triggers: [schedule(scn.id, 1, 1.0, amt, 'Delayed income')] });
      opts.push({ code: 'decline', label: 'Decline', amount_now: 0.0 });
    } else if (t === 'saving_pledge') {
      const total = scn.amount.value || 500.0;
      opts.push({ code: 'start', label: `Start pledge ($${Math.round(total)})`, amount_now: 0.0, effects: { saving_pledge: { total } } });
      opts.push({ code: 'start_smaller', label: `Start smaller pledge ($${Math.round(total * 0.8)})`, amount_now: 0.0, effects: { saving_pledge: { total: total * 0.8 } } });
      opts.push({ code: 'start_bigger', label: `Start larger pledge ($${Math.round(total * 1.2)})`, amount_now: 0.0, effects: { saving_pledge: { total: total * 1.2 } } });
      opts.push({ code: 'decline', label: 'Decline pledge', amount_now: 0.0 });
    } else if (t === 'lottery') {
      const ticketCost = -Math.abs(scn.amount.value || 2.0);
      opts.push({ code: 'skip', label: 'Skip', amount_now: 0.0 });
      opts.push({ code: 'buy_1', label: 'Buy 1 ticket', amount_now: ticketCost, triggers: [schedule('lottery_result', 1)] });
      opts.push({ code: 'buy_5', label: 'Buy 5 tickets', amount_now: ticketCost * 5, triggers: Array(5).fill(null).map(() => schedule('lottery_result', 1)) });
    } else {
      const amt = proposedAmount;
      if (amt >= 0) {
        opts.push({ code: 'accept', label: 'Accept', amount_now: amt });
        opts.push({ code: 'delay', label: 'Delay by 1 day', amount_now: 0.0, triggers: [schedule(scn.id, 1, 1.0, amt, 'Delayed')] });
        opts.push({ code: 'decline', label: 'Decline', amount_now: 0.0 });
      } else {
        opts.push({ code: 'skip', label: 'Skip', amount_now: 0.0 });
        opts.push({ code: 'regular', label: 'Proceed', amount_now: amt });
      }
    }

    for (const o of opts) {
      o.amount_now = parseFloat(o.amount_now.toFixed(2));
    }

    return opts;
  }

  scheduleTrigger(today: number, trig: any, sourceEvent: any): void {
    if (Math.random() > parseFloat(trig.prob || 1.0)) return;

    const due = today + parseInt(trig.after_days || 1);
    const payload = {
      spawn: trig.spawn,
      data: trig.data || {},
      source_event_id: sourceEvent.id,
    };

    if (!this.delayed_events[due]) {
      this.delayed_events[due] = [];
    }
    this.delayed_events[due].push(payload);
  }

  realizeDelayed(today: number, user: UserProfile): any[] {
    const realized: any[] = [];
    const payloads = this.delayed_events[today] || [];
    delete this.delayed_events[today];

    for (const p of payloads) {
      const spawnId = p.spawn;
      const data = p.data || {};
      const overrideAmount = data.override_amount;
      const extraDesc = data.extra_desc || '';

      if (spawnId === 'lottery_result') {
        const r = Math.random();
        let amount: number;
        let desc: string;

        if (r < 0.921) {
          amount = 0.0;
          desc = 'Lottery result: no win.';
        } else if (r < 0.921 + 0.079) {
          amount = 5 + Math.random() * 45;
          desc = 'Lottery result: small win.';
        } else {
          amount = 1000 + Math.random() * 9000;
          desc = 'Lottery result: big win!';
        }

        const scn = this.by_id['lottery_result'];
        if (scn) {
          const ev = this.instantiateEvent(scn, today, user, amount, desc);
          realized.push(ev);
        }
      } else {
        const scn = this.by_id[spawnId];
        if (scn) {
          const ev = this.instantiateEvent(scn, today, user, overrideAmount, extraDesc);
          realized.push(ev);
        }
      }
    }

    return realized;
  }

  proposeDay(user: UserProfile, day: number, maxProbabilistic: number = 6): Offer[] {
    this.user = user;
    const offers: Offer[] = [];

    // Forced delayed events
    const realized = this.realizeDelayed(day, user);
    for (const ev of realized) {
      const offer: Offer = {
        offer_id: uid('offer'),
        day,
        scenario_id: ev.scenario_id,
        name: ev.name,
        type: ev.type,
        tags: ev.tags || [],
        deterministic: true,
        proposed_amount: ev.amount,
        probability: 1.0,
        prob_details: { forced: 'triggered' },
        options: [{ code: 'forced', label: 'Forced', amount_now: ev.amount }],
        internal_forced_event: ev,
      };
      offers.push(offer);
    }

    // Deterministic schedules
    for (const scn of this.catalog) {
      if (scn.deterministic && this.isScheduledToday(scn, user, day)) {
        let ev: any;
        if (scn.name === 'Paycheck') {
          const amt = parseFloat(user.pay_cycle.amount?.toString() || '2000');
          this.last_pay_amount = amt;
          ev = this.instantiateEvent(scn, day, user, amt);
        } else {
          ev = this.instantiateEvent(scn, day, user);
        }

        const options = this.buildOptions(scn, ev.amount);
        const offer: Offer = {
          offer_id: uid('offer'),
          day,
          scenario_id: scn.id,
          name: scn.name,
          type: scn.type,
          tags: scn.tags || [],
          deterministic: true,
          proposed_amount: ev.amount,
          probability: 1.0,
          prob_details: { deterministic: 'schedule' },
          options,
        };
        offers.push(offer);
      }
    }

    // Probabilistic
    const probPool: Array<{ scn: Scenario; p: number; details: any }> = [];
    for (const scn of this.catalog) {
      if (!scn.deterministic) {
        const { prob: p, details } = this.computeProbability(scn, user, day);
        if (p > 0.0) {
          probPool.push({ scn, p, details });
        }
      }
    }
    probPool.sort((a, b) => b.p - a.p);

    let chosen = 0;
    for (const { scn, p, details } of probPool) {
      if (chosen >= maxProbabilistic) break;
      if (Math.random() < p) {
        const ev = this.instantiateEvent(scn, day, user);
        const options = this.buildOptions(scn, ev.amount);
        const offer: Offer = {
          offer_id: uid('offer'),
          day,
          scenario_id: scn.id,
          name: scn.name,
          type: scn.type,
          tags: scn.tags || [],
          deterministic: false,
          proposed_amount: ev.amount,
          probability: p,
          prob_details: details,
          options,
        };
        offers.push(offer);
        chosen++;
      }
    }

    this.pending_offers[day] = offers;
    return offers;
  }

  commitDay(day: number, choices: Record<string, string>): CommittedEvent[] {
    const offers = this.pending_offers[day] || [];
    delete this.pending_offers[day];
    const committed: CommittedEvent[] = [];

    for (const offer of offers) {
      const optCode = choices[offer.offer_id] || offer.options[0].code;

      if (optCode === 'forced' && offer.internal_forced_event) {
        const ev = offer.internal_forced_event;
        this.balance += ev.amount;
        ev.chosen_option = 'forced';
        ev.proposed_amount = offer.proposed_amount;
        ev.probability = offer.probability;
        ev.prob_details = offer.prob_details;
        committed.push(ev);
        this.history.push(ev);
        continue;
      }

      const picked = offer.options.find(o => o.code === optCode) || offer.options[0];
      const ev: CommittedEvent = {
        id: uid('ev'),
        day,
        scenario_id: offer.scenario_id,
        name: offer.name,
        type: offer.type,
        tags: offer.tags || [],
        deterministic: offer.deterministic || false,
        proposed_amount: parseFloat(offer.proposed_amount.toFixed(2)),
        amount: parseFloat(picked.amount_now.toFixed(2)),
        chosen_option: picked.code,
        chosen_label: picked.label,
        probability: offer.probability || 1.0,
        prob_details: offer.prob_details || {},
      };

      this.balance += ev.amount;
      if (ev.name === 'Paycheck') {
        this.last_pay_amount = ev.amount;
      }

      committed.push(ev);
      this.history.push(ev);

      if (picked.triggers) {
        for (const trig of picked.triggers) {
          this.scheduleTrigger(day, trig, ev);
        }
      }

      if (picked.effects?.saving_pledge) {
        const total = parseFloat(picked.effects.saving_pledge.total || 500);
        this.addSavingPlan(ev.name, total, day, 90, 'weekly');
      }
    }

    return committed;
  }

  addSavingPlan(name: string, total: number, startDay: number, dueInDays: number, frequency: string = 'weekly'): SavingPlan {
    const plan: SavingPlan = {
      plan_id: uid('plan'),
      name,
      total: parseFloat(total.toFixed(2)),
      start_day: startDay,
      due_day: startDay + dueInDays,
      frequency,
      contributed: 0.0,
    };
    this.active_saving_plans.push(plan);
    return plan;
  }
}
