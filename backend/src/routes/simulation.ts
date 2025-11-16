import { Router } from 'express';
import * as simulationController from '../controllers/simulationController';

const router = Router();

/**
 * GET /api/simulation/meta
 * Get available segments, moods, and defaults
 */
router.get('/meta', simulationController.getMeta);

/**
 * POST /api/simulation/start
 * Start a new simulation session
 */
router.post('/start', simulationController.startSimulation);

/**
 * GET /api/simulation/offers
 * Get current day's offers for a session
 */
router.get('/offers', simulationController.getOffers);

/**
 * POST /api/simulation/commit
 * Commit player's choices for the current day
 */
router.post('/commit', simulationController.commitChoices);

/**
 * GET /api/simulation/state
 * Get complete simulation state
 */
router.get('/state', simulationController.getState);

export default router;
