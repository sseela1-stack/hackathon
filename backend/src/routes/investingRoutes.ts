/**
 * Investing Routes
 * Educational portfolio simulation with DCA, fees, rebalancing, shocks, Monte Carlo
 */

import { Router } from 'express';
import { postSimulate, postMonteCarlo } from '../controllers/investingController';

const router = Router();

/**
 * POST /api/investing/simulate
 * Educational portfolio simulation with comprehensive features
 * 
 * Body:
 * - profile: 'conservative' | 'balanced' | 'aggressive'
 * - startValue: number
 * - years: number (1-40)
 * - seed?: string
 * - contribMonthly?: number
 * - feesBps?: number (0-100, default 10)
 * - rebalance?: 'none' | 'annual' | 'threshold'
 * - thresholdPct?: number (default 0.05)
 * - shocks?: { crashAtMonth?, crashPct?, inflationDriftCutBps?, pauseContribFrom?, pauseContribTo? }
 * - sequencePreset?: 'normal' | 'badFirstYears' | 'goodFirstYears'
 * - glidePath?: { startMix, endMix }
 */
router.post('/simulate', postSimulate);

/**
 * POST /api/investing/montecarlo
 * Monte Carlo simulation with percentile bands
 * 
 * Body: Same as /simulate plus:
 * - runs: number (10-500)
 * - targetAmount: number
 */
router.post('/montecarlo', postMonteCarlo);

export default router;
