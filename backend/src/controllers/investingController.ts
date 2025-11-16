/**
 * Investing Controller
 * Educational portfolio simulation with DCA, fees, rebalancing, shocks, Monte Carlo
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { simulatePortfolio, monteCarlo, PORTFOLIO_PROFILES, PortfolioMix } from '../services/investingService';
import createHttpError from 'http-errors';

/**
 * Zod schema for portfolio mix
 */
const portfolioMixSchema = z.object({
  stocks: z.number().min(0).max(1),
  bonds: z.number().min(0).max(1),
  cash: z.number().min(0).max(1),
}).refine(
  (mix) => {
    const sum = mix.stocks + mix.bonds + mix.cash;
    return Math.abs(sum - 1.0) < 0.02; // Allow small rounding errors
  },
  { message: 'Portfolio mix must sum to ~1.0' }
);

/**
 * Zod schema for market shocks
 */
const marketShocksSchema = z.object({
  crashAtMonth: z.number().int().min(0).optional(),
  crashPct: z.number().min(-1).max(0).optional(),
  inflationDriftCutBps: z.number().min(0).max(500).optional(),
  pauseContribFrom: z.number().int().min(0).optional(),
  pauseContribTo: z.number().int().min(0).optional(),
}).optional();

/**
 * Zod schema for glide path
 */
const glidePathSchema = z.object({
  startMix: portfolioMixSchema,
  endMix: portfolioMixSchema,
}).optional();

/**
 * Zod schema for simulate request
 */
const simulateBodySchema = z.object({
  profile: z.enum(['conservative', 'balanced', 'aggressive']),
  startValue: z.number().positive(),
  years: z.number().int().min(1).max(40),
  seed: z.string().optional(),
  contribMonthly: z.number().min(0).optional(),
  feesBps: z.number().min(0).max(100).optional().default(10),
  rebalance: z.enum(['none', 'annual', 'threshold']).optional().default('none'),
  thresholdPct: z.number().min(0).max(1).optional().default(0.05),
  shocks: marketShocksSchema,
  sequencePreset: z.enum(['normal', 'badFirstYears', 'goodFirstYears']).optional(),
  glidePath: glidePathSchema,
});

/**
 * Zod schema for Monte Carlo request
 */
const monteCarloBodySchema = simulateBodySchema.extend({
  runs: z.number().int().min(10).max(500),
  targetAmount: z.number().positive(),
});

/**
 * POST /api/investing/simulate
 * Educational portfolio simulation with DCA, fees, rebalancing, shocks
 */
export async function postSimulate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = simulateBodySchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid request body', {
        details: validation.error.issues,
      });
    }

    const { profile, ...params } = validation.data;
    const playerId = req.headers['x-player-id'] as string || 'anonymous';
    
    // Generate seed if not provided
    const seed = params.seed || `${playerId}:${profile}:${params.years}`;
    
    // Get portfolio mix from profile
    const mix = PORTFOLIO_PROFILES[profile];

    // Run simulation
    const result = simulatePortfolio({
      ...params,
      mix,
      seed,
    });

    res.json({
      success: true,
      path: result.monthly,
      trades: result.trades,
      stats: result.stats,
      meta: {
        profile,
        mix,
        seed,
        disclaimer: 'For learning only — not financial advice.',
      },
    });
  } catch (error) {
    console.error('Error in postSimulate:', error);
    next(error);
  }
}

/**
 * POST /api/investing/montecarlo
 * Monte Carlo simulation with percentile bands and success probability
 */
export async function postMonteCarlo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = monteCarloBodySchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid request body', {
        details: validation.error.issues,
      });
    }

    const { profile, runs, targetAmount, ...params } = validation.data;
    const playerId = req.headers['x-player-id'] as string || 'anonymous';
    
    // Generate seed if not provided
    const seed = params.seed || `${playerId}:${profile}:${params.years}:mc`;
    
    // Get portfolio mix from profile
    const mix = PORTFOLIO_PROFILES[profile];

    // Run Monte Carlo
    const result = monteCarlo({
      ...params,
      mix,
      seed,
      runs,
      targetAmount,
    });

    res.json({
      success: true,
      bands: result.bands,
      successProb: result.successProb,
      meta: {
        profile,
        mix,
        runs,
        targetAmount,
        seed,
        disclaimer: 'For learning only — not financial advice.',
      },
    });
  } catch (error) {
    console.error('Error in postMonteCarlo:', error);
    next(error);
  }
}
