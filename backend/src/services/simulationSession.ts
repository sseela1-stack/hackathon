import { ScenarioSelectorChoices, UserProfile, HUD, CommittedEvent } from './simulationEngine';

export class SessionState {
  user: UserProfile;
  selector: ScenarioSelectorChoices;
  day: number;
  offers: any[];
  health: number;
  accounts: {
    checking: number;
    savings: number;
    investments: number;
  };
  achievements: Set<string>;
  donation_total: number;
  positive_streak: number;
  last_day_net: number;

  constructor(user: UserProfile, selector: ScenarioSelectorChoices) {
    this.user = user;
    this.selector = selector;
    this.day = 1;
    this.offers = selector.proposeDay(user, 1);

    // HUD state
    this.health = 65.0;
    this.accounts = {
      checking: parseFloat(user.base_balance.toFixed(2)),
      savings: 0.0,
      investments: 0.0,
    };
    this.achievements = new Set();
    this.donation_total = 0.0;
    this.positive_streak = 0;
    this.last_day_net = 0.0;
  }

  private monthInfo(): { month: number; dom: number } {
    const month = Math.floor((this.day - 1) / 30) + 1;
    const dom = ((this.day - 1) % 30) + 1;
    return { month, dom };
  }

  private applyAccounts(committed: CommittedEvent[]): void {
    for (const ev of committed) {
      const amt = parseFloat(ev.amount.toFixed(2));
      const tags = new Set(ev.tags || []);
      const t = ev.type;
      const name = ev.name || '';

      if (t === 'income') {
        if (tags.has('investment') || tags.has('investment_income')) {
          this.accounts.investments += Math.max(amt, 0.0);
        } else {
          this.accounts.checking += Math.max(amt, 0.0);
        }
      } else {
        // expenses / bills / donation / lottery
        if (tags.has('savings') || name.toLowerCase().startsWith('saving plan contribution')) {
          const x = Math.abs(amt);
          this.accounts.checking -= x;
          this.accounts.savings += x;
        } else if (tags.has('investment')) {
          const x = Math.abs(amt);
          this.accounts.checking -= x;
          this.accounts.investments += x;
        } else {
          this.accounts.checking += amt; // amt is negative for outflows
        }
      }
    }

    // Round to 2 decimals
    this.accounts.checking = parseFloat(this.accounts.checking.toFixed(2));
    this.accounts.savings = parseFloat(this.accounts.savings.toFixed(2));
    this.accounts.investments = parseFloat(this.accounts.investments.toFixed(2));
  }

  private updateHealthAndAchievements(committed: CommittedEvent[]): void {
    // Net for the day
    const dayNet = committed.reduce((sum, ev) => sum + ev.amount, 0.0);

    // Donations sum (for achievement)
    const donationsToday = committed
      .filter(ev => ev.type === 'donation' || (ev.tags || []).includes('donation'))
      .reduce((sum, ev) => sum + Math.abs(ev.amount), 0.0);
    this.donation_total += donationsToday;

    // Positive/negative streak
    if (dayNet >= 0) {
      this.positive_streak += 1;
    } else {
      this.positive_streak = 0;
    }

    // Health update
    let delta = 0.0;
    if (dayNet >= 0) {
      delta += Math.min(3.0, dayNet / 500.0);
    } else {
      delta -= Math.min(6.0, Math.abs(dayNet) / 200.0);
    }

    for (const ev of committed) {
      const tags = new Set(ev.tags || []);
      const name = ev.name?.toLowerCase() || '';

      if (tags.has('emergency')) {
        delta -= 3.0;
      }
      if (tags.has('fees')) {
        delta -= 2.0;
      }
      if (tags.has('savings')) {
        delta += 1.0;
      }
      if (tags.has('donation')) {
        delta += 0.5;
      }
      if (tags.has('gambling') && name.startsWith('buy lottery ticket')) {
        delta -= 0.2;
      }
    }

    // Slight boost for building buffers
    const bufferScore = 0.01 * (this.accounts.savings + 0.5 * this.accounts.investments);
    delta += Math.min(2.0, bufferScore);

    this.health = parseFloat(Math.max(0.0, Math.min(100.0, this.health + delta)).toFixed(1));
    this.last_day_net = dayNet;

    // --- Achievements (5 total) ---
    // A1: First Paycheck
    if (committed.some(ev => ev.name === 'Paycheck' && ev.amount > 0)) {
      this.achievements.add('first_paycheck');
    }
    // A2: Emergency buffer $500 in savings
    if (this.accounts.savings >= 500.0) {
      this.achievements.add('buffer_500');
    }
    // A3: Net positive 7 days in a row
    if (this.positive_streak >= 7) {
      this.achievements.add('streak_7');
    }
    // A4: Donor $100 total
    if (this.donation_total >= 100.0) {
      this.achievements.add('donor_100');
    }
    // A5: Lucky day (lottery result > 0)
    if (committed.some(ev => ev.name === 'Lottery Result' && ev.amount > 0)) {
      this.achievements.add('lotto_win');
    }
  }

  hud(): HUD {
    const { month, dom } = this.monthInfo();
    return {
      month,
      day_in_month: dom,
      health: parseFloat(this.health.toFixed(1)),
      trophies: {
        earned: this.achievements.size,
        total: 5,
      },
      accounts: {
        checking: parseFloat(this.accounts.checking.toFixed(2)),
        savings: parseFloat(this.accounts.savings.toFixed(2)),
        investments: parseFloat(this.accounts.investments.toFixed(2)),
      },
    };
  }

  commit(choices: Record<string, string>): { committed: CommittedEvent[]; balance: number; day: number; next_offers: any[]; hud: HUD } {
    const committed = this.selector.commitDay(this.day, choices);

    // Update HUD elements
    this.applyAccounts(committed);
    this.updateHealthAndAchievements(committed);

    // Advance to next day
    this.day += 1;
    this.offers = this.selector.proposeDay(this.user, this.day);

    return {
      committed,
      balance: parseFloat(this.selector.balance.toFixed(2)),
      day: this.day,
      next_offers: this.offers,
      hud: this.hud(),
    };
  }

  getState(): any {
    return {
      day: this.day,
      balance: parseFloat(this.selector.balance.toFixed(2)),
      history: this.selector.history.slice(-100),
      hud: this.hud(),
    };
  }
}
