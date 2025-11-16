/**
 * Investing API client functions
 */

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Get or create a stable player ID stored in localStorage
 */
function getPlayerId(): string {
  const k = 'finquest_pid';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

/**
 * Portfolio snapshot at a point in time
 */
export interface PortfolioSnapshot {
  month: number;
  value: number;
  stocks: number;
  bonds: number;
  cash: number;
}

/**
 * Trade record from rebalancing
 */
export interface TradeRecord {
  month: number;
  from: string;
  to: string;
  amount: number;
}

/**
 * Portfolio statistics
 */
export interface PortfolioStats {
  endValue: number;
  cagr: number;
  stdev: number;
  maxDrawdown: number;
  feeTotal: number;
}

/**
 * Simulation result from /simulate endpoint
 */
export interface SimulationResult {
  success: boolean;
  path: PortfolioSnapshot[];
  trades: TradeRecord[];
  stats: PortfolioStats;
  meta: {
    profile: string;
    mix: { stocks: number; bonds: number; cash: number };
    seed: string;
    disclaimer: string;
  };
}

/**
 * Monte Carlo band at a point in time
 */
export interface MonteCarloBand {
  month: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

/**
 * Monte Carlo result from /montecarlo endpoint
 */
export interface MonteCarloResult {
  success: boolean;
  bands: MonteCarloBand[];
  successProb: number;
  meta: {
    profile: string;
    mix: { stocks: number; bonds: number; cash: number };
    runs: number;
    targetAmount?: number;
    seed: string;
    disclaimer: string;
  };
}

/**
 * Simulate portfolio investment path with comprehensive parameters
 */
export async function simulatePortfolio(params: {
  profile: 'conservative' | 'balanced' | 'aggressive';
  startValue: number;
  years: number;
  contribMonthly?: number;
  feesBps?: number;
  rebalance?: 'none' | 'annual' | 'threshold';
  thresholdPct?: number;
  shocks?: {
    crashAtMonth?: number;
    crashPct?: number;
    inflationDriftCutBps?: number;
    pauseContribFrom?: number;
    pauseContribTo?: number;
  };
  sequencePreset?: 'normal' | 'badFirstYears' | 'goodFirstYears';
  glidePath?: {
    startMix: { stocks: number; bonds: number; cash: number };
    endMix: { stocks: number; bonds: number; cash: number };
  };
  seed?: string;
}): Promise<SimulationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/investing/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to simulate portfolio: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error simulating portfolio:', error);
    throw error;
  }
}

/**
 * Run Monte Carlo simulation with multiple runs
 */
export async function runMonteCarlo(params: {
  profile: 'conservative' | 'balanced' | 'aggressive';
  startValue: number;
  years: number;
  runs: number;
  targetAmount?: number;
  contribMonthly?: number;
  feesBps?: number;
  rebalance?: 'none' | 'annual' | 'threshold';
  seed?: string;
}): Promise<MonteCarloResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/investing/montecarlo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to run Monte Carlo: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error running Monte Carlo:', error);
    throw error;
  }
}
