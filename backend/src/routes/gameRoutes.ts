import { Router } from 'express';
import { getGameState, postChoice, getPlaybook } from '../controllers/gameController';

const router = Router();

/**
 * Game routes
 */

// GET /api/game/state - Get current game state
router.get('/state', getGameState);

// POST /api/game/choice - Make a choice in the game
router.post('/choice', postChoice);

// GET /api/game/playbook - Get money playbook summary
router.get('/playbook', getPlaybook);

export default router;
