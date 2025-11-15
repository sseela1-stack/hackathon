import { Request, Response } from 'express';
import {
  generateAgentReply,
  AgentName,
  AgentContext,
  AIServiceError,
} from '../services/aiService';

/**
 * Controller for AI agent-related endpoints
 */

/**
 * POST /api/agent/:agentName
 * Get a message from a specific AI agent
 */
export const getAgentMessage = async (req: Request, res: Response) => {
  try {
    const agentName = req.params.agentName as AgentName;

    // Validate agent name
    const validAgents: AgentName[] = [
      'mentor',
      'spenderSam',
      'saverSiya',
      'crisisCoach',
      'futureYou',
      'translator',
    ];

    if (!validAgents.includes(agentName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent name. Valid agents: ${validAgents.join(', ')}`,
      });
    }

    // Get context from request body
    const context: AgentContext = req.body.context || {};
    const term = req.body.term; // For translator agent

    // Generate agent reply
    const reply = await generateAgentReply(agentName, context, term);

    res.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    console.error('Error getting agent message:', error);

    if (error instanceof AIServiceError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get agent message',
    });
  }
};

/**
 * POST /api/agent/mentor
 * Get personalized guidance from the mentor
 */
export const getMentorAdvice = async (req: Request, res: Response) => {
  try {
    const context: AgentContext = {
      playerRole: req.body.playerRole,
      difficulty: req.body.difficulty,
      currentBalance: req.body.currentBalance,
      scenarioDescription: req.body.scenarioDescription,
      recentDecisions: req.body.recentDecisions,
      mood: req.body.mood,
    };

    const reply = await generateAgentReply('mentor', context);

    res.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    console.error('Error getting mentor advice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mentor advice',
    });
  }
};

/**
 * POST /api/agent/spenderSam
 * Get message from Spender Sam
 */
export const getSpenderSamMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'spenderSam';
  return getAgentMessage(req, res);
};

/**
 * POST /api/agent/saverSiya
 * Get message from Saver Siya
 */
export const getSaverSiyaMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'saverSiya';
  return getAgentMessage(req, res);
};

/**
 * POST /api/agent/crisisCoach
 * Get crisis triage guidance
 */
export const getCrisisMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'crisisCoach';
  return getAgentMessage(req, res);
};

/**
 * POST /api/agent/futureYou
 * Get message from Future You
 */
export const getFutureYouMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'futureYou';
  return getAgentMessage(req, res);
};

/**
 * POST /api/agent/translator
 * Get financial term translation
 */
export const getTranslatorMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'translator';
  return getAgentMessage(req, res);
};
