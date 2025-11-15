import { Router } from 'express';
import {
  getAgentMessage,
  getMentorAdvice,
  getSpenderSamMessage,
  getSaverSiyaMessage,
  getCrisisMessage,
  getFutureYouMessage,
  getTranslatorMessage,
} from '../controllers/agentController';

const router = Router();

/**
 * AI Agent routes
 */

// POST /api/agent/:agentName - Get message from any agent
router.post('/:agentName', getAgentMessage);

// POST /api/agent/mentor/advice - Get personalized advice
router.post('/mentor/advice', getMentorAdvice);

// Individual agent routes (convenience endpoints)
router.post('/spenderSam', getSpenderSamMessage);
router.post('/saverSiya', getSaverSiyaMessage);
router.post('/crisis', getCrisisMessage);
router.post('/futureYou', getFutureYouMessage);
router.post('/translator', getTranslatorMessage);

export default router;
