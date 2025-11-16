/**
 * Investment Portfolio Simulation Service
 * Educational simulations with DCA, fees, rebalancing, shocks, Monte Carlo
 * Uses seeded RNG for deterministic, reproducible results
 */

import { makeRng, Rng } from '../utils/rng';

/**
 * Portfolio allocation mix (must sum to ~1.0)
 */
export interface PortfolioMix {
  stocks: number; // 0-1 (e.g., 0.6 = 60%)
  bonds: number;  // 0-1
  cash: number;   // 0-1
}

/**
 * Market shocks configuration
 */
export interface MarketShocks {
  crashAtMonth?: number;
  crashPct?: number; // e.g., -0.35 for -35%
  inflationDriftCutBps?: number; // reduce expected returns by bps
  pauseContribFrom?: number;
  pauseContribTo?: number;
}

/**
 * Glide path configuration
 */
export interface GlidePath {
  startMix: PortfolioMix;
  endMix: PortfolioMix;
}

/**
 * Trade record
 */
export interface TradeRecord {
  month: number;
  from: string;
  to: string;
  amount: number;
}

/**
 * Asset class return parameters (annualized, educational only)
 */
interface AssetParams {
  mu: number;    // Expected annual return
  sigma: number; // Annual volatility
}

/**
 * Educational baseline parameters (not financial advice)
 */
const ASSET_PARAMS: Record<keyof PortfolioMix, AssetParams> = {
  stocks: { mu: 0.07, sigma: 0.15 },
  bonds: { mu: 0.03, sigma: 0.05 },
  cash: { mu: 0.015, sigma: 0.01 }
};

/**
 * Predefined portfolio profiles
 */
export const PORTFOLIO_PROFILES: Record<string, PortfolioMix> = {
  conservative: {
    stocks: 0.30,
    bonds: 0.60,
    cash: 0.10,
  },
  balanced: {
    stocks: 0.60,
    bonds: 0.35,
    cash: 0.05,
  },
  aggressive: {
    stocks: 0.90,
    bonds: 0.10,
    cash: 0.00,
  },
};

/**
 * Portfolio snapshot
 */
export interface PortfolioSnapshot {
  month: number;
  value: number;
  stocks: number;
  bonds: number;
  cash: number;
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
 * Enhanced simulation result
 */
export interface SimulationResult {
  monthly: PortfolioSnapshot[];
  trades: TradeRecord[];
  stats: PortfolioStats;
}

/**
 * Monte Carlo band
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
 * Monte Carlo result
 */
export interface MonteCarloResult {
  bands: MonteCarloBand[];
  successProb: number;
}

/**
 * Convert annualized parameters to monthly
 */
function annualToMonthly(mu: number, sigma: number): { mu: number; sigma: number } {
  return {
    mu: Math.pow(1 + mu, 1 / 12) - 1,
    sigma: sigma / Math.sqrt(12)
  };
}

/**
 * Generate monthly returns using Box-Muller transform
 */
function generateMonthlyReturn(rng: Rng, muMonthly: number, sigmaMonthly: number): number {
  const u1 = rng.next();
  const u2 = rng.next();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return muMonthly + sigmaMonthly * z0;
}

/**
 * Calculate portfolio return for a month given asset class returns
 */
function calculatePortfolioReturn(
  mix: PortfolioMix,
  returns: Record<keyof PortfolioMix, number>
): number {
  return (
    mix.stocks * returns.stocks +
    mix.bonds * returns.bonds +
    mix.cash * returns.cash
  );
}

/**
 * Rebalance portfolio to target mix
 */
function rebalancePortfolio(
  holdings: PortfolioMix & { totalValue: number },
  targetMix: PortfolioMix,
  month: number,
  trades: TradeRecord[]
): PortfolioMix {
  const { totalValue } = holdings;
  const newHoldings: PortfolioMix = {
    stocks: totalValue * targetMix.stocks,
    bonds: totalValue * targetMix.bonds,
    cash: totalValue * targetMix.cash
  };

  // Record significant trades
  if (Math.abs(newHoldings.stocks - holdings.stocks) > 100) {
    const amount = Math.abs(newHoldings.stocks - holdings.stocks);
    trades.push({
      month,
      from: newHoldings.stocks > holdings.stocks ? 'bonds/cash' : 'stocks',
      to: newHoldings.stocks > holdings.stocks ? 'stocks' : 'bonds/cash',
      amount
    });
  }

  return newHoldings;
}

/**
 * Check if portfolio needs threshold rebalancing
 */
function needsRebalancing(holdings: PortfolioMix, targetMix: PortfolioMix, thresholdPct: number): boolean {
  const totalValue = holdings.stocks + holdings.bonds + holdings.cash;
  if (totalValue === 0) return false;

  const currentStocks = holdings.stocks / totalValue;
  const currentBonds = holdings.bonds / totalValue;
  const currentCash = holdings.cash / totalValue;

  return (
    Math.abs(currentStocks - targetMix.stocks) > thresholdPct ||
    Math.abs(currentBonds - targetMix.bonds) > thresholdPct ||
    Math.abs(currentCash - targetMix.cash) > thresholdPct
  );
}

/**
 * Simulate portfolio with DCA, fees, rebalancing, shocks, glide path
 */
export function simulatePortfolio(params: {
  startValue: number;
  mix: PortfolioMix;
  contribMonthly?: number;
  years: number;
  feesBps?: number;
  rebalance?: 'none' | 'annual' | 'threshold';
  thresholdPct?: number;
  seed: string;
  shocks?: MarketShocks;
  sequencePreset?: 'normal' | 'badFirstYears' | 'goodFirstYears';
  glidePath?: GlidePath;
}): SimulationResult {
  const {
    startValue,
    mix,
    contribMonthly = 0,
    years,
    feesBps = 10,
    rebalance = 'none',
    thresholdPct = 0.05,
    seed,
    shocks,
    sequencePreset,
    glidePath
  } = params;

  const months = years * 12;
  const rng = makeRng(seed);
  const monthly: PortfolioSnapshot[] = [];
  const trades: TradeRecord[] = [];

  // Convert annual params to monthly
  let stocksParams = annualToMonthly(ASSET_PARAMS.stocks.mu, ASSET_PARAMS.stocks.sigma);
  let bondsParams = annualToMonthly(ASSET_PARAMS.bonds.mu, ASSET_PARAMS.bonds.sigma);
  let cashParams = annualToMonthly(ASSET_PARAMS.cash.mu, ASSET_PARAMS.cash.sigma);

  // Apply inflation drift cut if specified
  if (shocks?.inflationDriftCutBps) {
    const reduction = shocks.inflationDriftCutBps / 10000 / 12;
    stocksParams.mu -= reduction;
    bondsParams.mu -= reduction;
    cashParams.mu -= reduction;
  }

  // Generate return series
  const stockReturns: number[] = [];
  const bondReturns: number[] = [];
  const cashReturns: number[] = [];

  for (let m = 0; m < months; m++) {
    stockReturns.push(generateMonthlyReturn(rng, stocksParams.mu, stocksParams.sigma));
    bondReturns.push(generateMonthlyReturn(rng, bondsParams.mu, bondsParams.sigma));
    cashReturns.push(generateMonthlyReturn(rng, cashParams.mu, cashParams.sigma));
  }

  // Apply crash shock
  if (shocks?.crashAtMonth !== undefined && shocks?.crashPct !== undefined) {
    const month = shocks.crashAtMonth;
    if (month >= 0 && month < months) {
      stockReturns[month] += shocks.crashPct;
    }
  }

  // Apply sequence preset
  if (sequencePreset === 'badFirstYears') {
    const sortedStocks = [...stockReturns].sort((a, b) => a - b);
    for (let i = 0; i < months; i++) {
      stockReturns[i] = sortedStocks[i];
    }
  } else if (sequencePreset === 'goodFirstYears') {
    const sortedStocks = [...stockReturns].sort((a, b) => b - a);
    for (let i = 0; i < months; i++) {
      stockReturns[i] = sortedStocks[i];
    }
  }

  let holdings: PortfolioMix = {
    stocks: startValue * mix.stocks,
    bonds: startValue * mix.bonds,
    cash: startValue * mix.cash
  };

  let feeTotal = 0;
  const monthlyFeeRate = (feesBps / 10000) / 12;

  for (let month = 0; month < months; month++) {
    // Add contributions (unless paused)
    const isPaused = shocks?.pauseContribFrom !== undefined &&
                     shocks?.pauseContribTo !== undefined &&
                     month >= shocks.pauseContribFrom &&
                     month <= shocks.pauseContribTo;

    if (!isPaused && contribMonthly > 0) {
      holdings.stocks += contribMonthly * mix.stocks;
      holdings.bonds += contribMonthly * mix.bonds;
      holdings.cash += contribMonthly * mix.cash;
    }

    // Apply returns
    holdings.stocks *= (1 + stockReturns[month]);
    holdings.bonds *= (1 + bondReturns[month]);
    holdings.cash *= (1 + cashReturns[month]);

    // Apply fees
    const totalValue = holdings.stocks + holdings.bonds + holdings.cash;
    const feeAmount = totalValue * monthlyFeeRate;
    feeTotal += feeAmount;
    const feeRatio = 1 - monthlyFeeRate;
    holdings.stocks *= feeRatio;
    holdings.bonds *= feeRatio;
    holdings.cash *= feeRatio;

    // Determine target mix (glide path or fixed)
    let targetMix = mix;
    if (glidePath) {
      const progress = month / months;
      targetMix = {
        stocks: glidePath.startMix.stocks + (glidePath.endMix.stocks - glidePath.startMix.stocks) * progress,
        bonds: glidePath.startMix.bonds + (glidePath.endMix.bonds - glidePath.startMix.bonds) * progress,
        cash: glidePath.startMix.cash + (glidePath.endMix.cash - glidePath.startMix.cash) * progress
      };
    }

    // Rebalancing
    const totalValueAfterFees = holdings.stocks + holdings.bonds + holdings.cash;
    if (rebalance === 'annual' && month > 0 && month % 12 === 0) {
      holdings = rebalancePortfolio({ ...holdings, totalValue: totalValueAfterFees }, targetMix, month, trades);
    } else if (rebalance === 'threshold' && needsRebalancing(holdings, targetMix, thresholdPct)) {
      holdings = rebalancePortfolio({ ...holdings, totalValue: totalValueAfterFees }, targetMix, month, trades);
    }

    monthly.push({
      month,
      value: holdings.stocks + holdings.bonds + holdings.cash,
      stocks: holdings.stocks,
      bonds: holdings.bonds,
      cash: holdings.cash
    });
  }

  const stats = computeStats(monthly, feeTotal);
  return { monthly, trades, stats };
}

/**
 * Compute portfolio statistics
 */
function computeStats(series: PortfolioSnapshot[], feeTotal: number): PortfolioStats {
  if (series.length === 0) {
    return { endValue: 0, cagr: 0, stdev: 0, maxDrawdown: 0, feeTotal };
  }

  const startValue = series[0].value;
  const endValue = series[series.length - 1].value;
  const years = series.length / 12;
  const cagr = startValue > 0 ? Math.pow(endValue / startValue, 1 / years) - 1 : 0;

  // Compute monthly returns
  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1].value > 0) {
      returns.push((series[i].value - series[i - 1].value) / series[i - 1].value);
    }
  }

  // Standard deviation (annualized)
  const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length : 0;
  const stdev = Math.sqrt(variance) * Math.sqrt(12);

  // Max drawdown
  let peak = series[0].value;
  let maxDrawdown = 0;
  for (const snapshot of series) {
    if (snapshot.value > peak) {
      peak = snapshot.value;
    }
    const drawdown = peak > 0 ? (peak - snapshot.value) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return { endValue, cagr, stdev, maxDrawdown, feeTotal };
}

/**
 * Run Monte Carlo simulation
 */
export function monteCarlo(params: {
  runs: number;
  targetAmount: number;
  startValue: number;
  mix: PortfolioMix;
  contribMonthly?: number;
  years: number;
  feesBps?: number;
  rebalance?: 'none' | 'annual' | 'threshold';
  thresholdPct?: number;
  seed: string;
  shocks?: MarketShocks;
  sequencePreset?: 'normal' | 'badFirstYears' | 'goodFirstYears';
  glidePath?: GlidePath;
}): MonteCarloResult {
  const { runs, targetAmount, ...simParams } = params;
  const months = simParams.years * 12;

  const allRuns: PortfolioSnapshot[][] = [];
  let successCount = 0;

  for (let run = 0; run < runs; run++) {
    const runSeed = `${simParams.seed}:run${run}`;
    const result = simulatePortfolio({ ...simParams, seed: runSeed });
    allRuns.push(result.monthly);

    // Check success
    if (result.monthly[result.monthly.length - 1].value >= targetAmount) {
      successCount++;
    }
  }

  // Compute percentiles for each month
  const bands: MonteCarloBand[] = [];
  for (let month = 0; month < months; month++) {
    const values = allRuns.map(run => run[month].value).sort((a, b) => a - b);
    
    bands.push({
      month,
      p10: percentile(values, 0.10),
      p25: percentile(values, 0.25),
      p50: percentile(values, 0.50),
      p75: percentile(values, 0.75),
      p90: percentile(values, 0.90)
    });
  }

  const successProb = successCount / runs;

  return { bands, successProb };
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sorted: number[], p: number): number {
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
