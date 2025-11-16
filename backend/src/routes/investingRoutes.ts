/**
 * Investing Routes
 * Routes for investment simulation and portfolio management
 */

import { Router } from 'express';
import { getSimulate, postRebalance } from '../controllers/investingController';

const router = Router();

/**
 * GET /api/investing/simulate
 * Simulates a 12-month investment portfolio performance
 * 
 * Query params:
 * - profile: conservative | balanced | aggressive (default: balanced)
 * - start: number (starting value, default: 1000)
 * - market: bull | bear | sideways (default: sideways)
 */
router.get('/simulate', getSimulate);

/**
 * POST /api/investing/rebalance
 * Analyzes portfolio and provides rebalancing recommendations
 * 
 * Body:
 * - path: number[] - historical portfolio values
 * - targetMix: { stocks, bonds, cash } - desired allocation (percentages must sum to 1.0)
 */
router.post('/rebalance', postRebalance);

export default router;
