import { AgentType } from '../models/GameState';

/**
 * Service for generating AI agent messages
 * TODO: Integrate with actual LLM provider (OpenAI, Anthropic, etc.)
 */

export interface AgentMessageRequest {
  agentType: AgentType;
  context: {
    eventDescription?: string;
    userBalance?: number;
    mood?: string;
    previousChoices?: string[];
  };
}

export class AIService {
  /**
   * Get a message from a specific AI agent
   * TODO: Implement actual LLM API call with agent-specific prompts
   */
  async getAgentMessage(request: AgentMessageRequest): Promise<string> {
    console.log(`TODO: Generate AI message for agent ${request.agentType}`);
    
    // Mock responses based on agent type
    const mockResponses: Record<AgentType, string> = {
      mentor: "Welcome to FinQuest! I'm here to guide you through your financial journey. Let's start by understanding your current situation and goals.",
      spenderSam: "Hey! Life is short, you know? Sometimes you gotta treat yourself. That new gadget looks pretty cool, right?",
      saverSiya: "Have you considered putting that money into your savings instead? Building an emergency fund is crucial for financial stability.",
      crisis: "URGENT: An unexpected expense has appeared! This is a critical moment that requires immediate attention.",
      futureYou: "Looking back from 10 years in the future, you'll thank yourself for the smart choices you make today. Think long-term.",
      translator: "Let me break down that financial jargon for you in simple terms you can understand...",
    };

    return mockResponses[request.agentType] || "Agent message not found.";
  }

  /**
   * Generate personalized financial advice based on user state
   * TODO: Implement comprehensive AI analysis with user data
   */
  async generateAdvice(
    userState: {
      balance: number;
      healthScore: number;
      recentChoices: string[];
    }
  ): Promise<string> {
    console.log('TODO: Generate personalized advice using AI');
    
    // Mock advice
    return "Based on your current financial situation, consider focusing on building your emergency fund before making large purchases.";
  }

  /**
   * Analyze user's mood and adjust agent responses accordingly
   * TODO: Implement mood-aware response generation
   */
  async adjustForMood(message: string, mood: string): Promise<string> {
    console.log(`TODO: Adjust message tone for mood: ${mood}`);
    
    // For now, just return the original message
    return message;
  }
}

export const aiService = new AIService();
