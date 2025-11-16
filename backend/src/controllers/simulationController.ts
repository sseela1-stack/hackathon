import { Request, Response, NextFunction } from 'express';
import { loadCatalog, ScenarioSelectorChoices, UserProfile } from '../services/simulationEngine';
import { SessionState } from '../services/simulationSession';
import * as path from 'path';

// In-memory session storage (use Redis in production)
const SESSIONS: Map<string, SessionState> = new Map();

// Load catalog once at startup
const SCENARIOS_PATH = path.join(__dirname, '../scenarios');
const CATALOG = loadCatalog(SCENARIOS_PATH);

console.log(`Loaded ${CATALOG.length} scenarios from ${SCENARIOS_PATH}`);

export const getMeta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segments = {
      student_independent: { name: 'Student (Self-supporting)', description: 'College student supporting themselves' },
      early_career: { name: 'Early Career', description: 'Young professional starting career' },
      mid_career: { name: 'Mid-career Professional', description: 'Established professional with responsibilities' },
    };

    const moods = ['optimistic', 'pessimistic', 'stressed', 'bored', 'generous', 'frugal'];

    const defaults = {
      segment_key: 'early_career',
      mood: 'optimistic',
      pay_type: 'biweekly',
      pay_start_day: 1,
      pay_amount: 2200.0,
      base_balance: 1500.0,
    };

    res.json({ segments, moods, defaults });
  } catch (error) {
    next(error);
  }
};

export const startSimulation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name = 'Player',
      segment_key = 'early_career',
      mood = 'optimistic',
      pay_type = 'biweekly',
      pay_start_day = 1,
      pay_amount = 2200.0,
      base_balance = 1500.0,
      predispositions = {},
    } = req.body;

    const user: UserProfile = {
      name,
      segment_key,
      mood,
      pay_cycle: {
        type: pay_type,
        start_day: pay_start_day,
        amount: pay_amount,
      },
      predispositions,
      base_balance,
    };

    const selector = new ScenarioSelectorChoices([...CATALOG]);
    selector.balance = base_balance;

    const session_id = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const state = new SessionState(user, selector);

    SESSIONS.set(session_id, state);

    // Auto-cleanup sessions after 2 hours
    setTimeout(() => {
      SESSIONS.delete(session_id);
    }, 2 * 60 * 60 * 1000);

    res.json({
      session_id,
      day: state.day,
      balance: parseFloat(selector.balance.toFixed(2)),
      offers: state.offers,
      hud: state.hud(),
      user: {
        name: user.name,
        segment_key: user.segment_key,
        mood: user.mood,
        pay_cycle: user.pay_cycle,
        base_balance: user.base_balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const state = SESSIONS.get(session_id);
    if (!state) {
      return res.status(404).json({ error: 'Invalid session_id' });
    }

    res.json({
      day: state.day,
      balance: parseFloat(state.selector.balance.toFixed(2)),
      offers: state.offers,
      hud: state.hud(),
    });
  } catch (error) {
    next(error);
  }
};

export const commitChoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id, choices } = req.body;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }

    if (!choices || typeof choices !== 'object') {
      return res.status(400).json({ error: 'choices object is required' });
    }

    const state = SESSIONS.get(session_id);
    if (!state) {
      return res.status(404).json({ error: 'Invalid session_id' });
    }

    const result = state.commit(choices);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const state = SESSIONS.get(session_id);
    if (!state) {
      return res.status(404).json({ error: 'Invalid session_id' });
    }

    res.json(state.getState());
  } catch (error) {
    next(error);
  }
};
