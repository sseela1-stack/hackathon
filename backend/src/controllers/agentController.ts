/**
 * Agent Controller
 * Handles AI agent message generation with context-based responses
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { generateAgentReply } from '../services/aiService';

/**
 * Valid agent names
 */
const VALID_AGENTS = [
  'mentor',
  'spenderSam',
  'saverSiya',
  'crisisCoach',
  'futureYou',
  'translator',
] as const;

type AgentName = typeof VALID_AGENTS[number];

/**
 * Zod schemas for request validation
 */
const agentContextSchema = z.object({
  context: z.any().optional(), // Flexible context object
});

const translatorSchema = z.object({
  term: z.string().min(1, 'Term is required for translator'),
  context: z.any().optional(),
});

/**
 * Extract player ID from request header
 */
function getPlayerId(req: Request): string {
  const playerId = req.headers['x-player-id'];
  if (typeof playerId === 'string' && playerId.length > 0) {
    return playerId;
  }
  return 'dev-player-001';
}

/**
 * POST /api/agent/:agentName
 * Get a message from a specific AI agent
 * 
 * Body for general agents: { context?: any }
 * Body for translator: { term: string, context?: any }
 */
export async function postAgentMessage(req: Request, res: Response): Promise<void> {
  try {
    const agentName = req.params.agentName;
    const playerId = getPlayerId(req);

    // Validate agent name
    if (!VALID_AGENTS.includes(agentName as AgentName)) {
      res.status(400).json({
        success: false,
        error: 'Invalid agent name',
        message: `Agent must be one of: ${VALID_AGENTS.join(', ')}`,
        validAgents: VALID_AGENTS,
      });
      return;
    }

    // Validate request body based on agent type
    let context: any;
    let term: string | undefined;

    if (agentName === 'translator') {
      // Translator requires term
      const validation = translatorSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body for translator',
          details: validation.error.issues,
        });
        return;
      }
      term = validation.data.term;
      context = validation.data.context;
    } else {
      // Other agents use flexible context
      const validation = agentContextSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        });
        return;
      }
      context = validation.data.context || {};
    }

    // Generate agent reply
    const agentReply = await generateAgentReply(
      agentName as any,
      context,
      term
    );

    res.json({
      success: true,
      agent: agentReply.agent,
      message: agentReply.message,
      tokens: agentReply.tokens,
      playerId,
    });
  } catch (error) {
    console.error('Error in postAgentMessage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate agent message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
