import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { AgentType } from '../models/GameState';

/**
 * Controller for AI agent-related endpoints
 */

/**
 * POST /api/agent/:agentName
 * Get a message from a specific AI agent
 */
export const getAgentMessage = async (req: Request, res: Response) => {
  try {
    const agentName = req.params.agentName as AgentType;
    
    // Validate agent name
    const validAgents: AgentType[] = [
      'mentor',
      'spenderSam',
      'saverSiya',
      'crisis',
      'futureYou',
      'translator',
    ];

    if (!validAgents.includes(agentName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent name. Valid agents: ${validAgents.join(', ')}`,
      });
    }

    // Get context from request body (optional)
    const context = req.body.context || {};

    // Get agent message
    const message = await aiService.getAgentMessage({
      agentType: agentName,
      context,
    });

    res.json({
      success: true,
      data: {
        agent: agentName,
        message,
      },
    });
  } catch (error) {
    console.error('Error getting agent message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent message',
    });
  }
};

/**
 * POST /api/agent/mentor/advice
 * Get personalized financial advice from the mentor
 */
export const getMentorAdvice = async (req: Request, res: Response) => {
  try {
    const { balance, healthScore, recentChoices } = req.body;

    const advice = await aiService.generateAdvice({
      balance: balance || 0,
      healthScore: healthScore || 50,
      recentChoices: recentChoices || [],
    });

    res.json({
      success: true,
      data: {
        advice,
      },
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
 * POST /api/agent/crisis
 * Get crisis alert message
 */
export const getCrisisMessage = async (req: Request, res: Response) => {
  req.params.agentName = 'crisis';
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
