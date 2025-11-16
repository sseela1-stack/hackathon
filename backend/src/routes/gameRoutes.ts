import { Router } from 'express';
import { getGameState, postChoice, getPlaybook, patchUiHints, postMood, postChatMessage } from '../controllers/gameController';

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

// PATCH /api/game/state/ui - Clear UI hints
router.patch('/state/ui', patchUiHints);

// POST /api/game/mood - Update player mood
router.post('/mood', postMood);

// POST /api/game/chat - Chat with financial mentor
router.post('/chat', postChatMessage);

export default router;
