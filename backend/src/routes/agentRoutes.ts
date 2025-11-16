import { Router } from 'express';
import { postAgentMessage } from '../controllers/agentController';

const router = Router();

/**
 * AI Agent routes
 * POST /api/agent/:agentName
 * 
 * Valid agents: mentor, spenderSam, saverSiya, crisisCoach, futureYou, translator
 */
router.post('/:agentName', postAgentMessage);

export default router;
