import { env } from '../config/env';

/**
 * Provider-agnostic LLM adapter and agent prompt templates
 * Supports OpenAI, Anthropic, and Google Gemini APIs
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  text: string;
  tokens?: number;
}

export interface AIProvider {
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
}

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface AgentContext {
  playerRole?: string;
  difficulty?: string;
  currentBalance?: number;
  scenarioDescription?: string;
  recentDecisions?: string[];
  mood?: string;
  [key: string]: unknown;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ============================================================================
// Provider Adapters
// ============================================================================

/**
 * OpenAI API Adapter (GPT-4, GPT-3.5-turbo, etc.)
 * TODO: Implement actual OpenAI API calls when API key is available
 */
export class OpenAIAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.openai.com/v1';
  private readonly model: string;

  constructor(apiKey: string, model: string = 'gpt-4') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: opts?.temperature ?? 0.7,
          max_tokens: opts?.maxTokens ?? 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIServiceError(
          `OpenAI API error: ${response.statusText}`,
          'openai',
          response.status
        );
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || '',
        tokens: data.usage?.total_tokens,
      };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        `OpenAI request failed: ${(error as Error).message}`,
        'openai'
      );
    }
  }
}

/**
 * Anthropic API Adapter (Claude models)
 * TODO: Implement actual Anthropic API calls when API key is available
 */
export class AnthropicAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.anthropic.com/v1';
  private readonly model: string;

  constructor(apiKey: string, model: string = 'claude-3-sonnet-20240229') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    try {
      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const conversationMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          system: systemMessage,
          messages: conversationMessages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: opts?.maxTokens ?? 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIServiceError(
          `Anthropic API error: ${response.statusText}`,
          'anthropic',
          response.status
        );
      }

      const data = await response.json();
      return {
        text: data.content[0]?.text || '',
        tokens: data.usage?.input_tokens + data.usage?.output_tokens,
      };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        `Anthropic request failed: ${(error as Error).message}`,
        'anthropic'
      );
    }
  }
}

/**
 * Google Gemini API Adapter
 * Supports Gemini Pro and other Google AI models
 */
export class GeminiAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model: string;

  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    try {
      // Gemini uses a different message format - combine system and user messages
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessages = messages.filter((m) => m.role !== 'system');

      // Format messages for Gemini
      const parts = userMessages.map((m) => {
        if (m.role === 'user') {
          return { text: systemMessage ? `${systemMessage}\n\n${m.content}` : m.content };
        }
        // For assistant messages, we'll need to use chat history format
        return { text: m.content };
      });

      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [parts[parts.length - 1]], // Use the last message
              },
            ],
            generationConfig: {
              temperature: opts?.temperature ?? 0.7,
              maxOutputTokens: opts?.maxTokens ?? 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIServiceError(
          `Gemini API error: ${response.statusText}`,
          'gemini',
          response.status
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        tokens: data.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        `Gemini request failed: ${(error as Error).message}`,
        'gemini'
      );
    }
  }
}

// ============================================================================
// LLM Singleton - Auto-selects first available provider
// ============================================================================

/**
 * Creates and returns the first available AI provider adapter
 * Priority: Gemini (if starts with AIza) > OpenAI (if starts with sk-) > Anthropic
 */
function createLLMProvider(): AIProvider {
  const apiKey = env.ai.apiKey;
  const model = env.ai.model;

  // Detect provider based on API key format
  if (apiKey.startsWith('AIza')) {
    // Google Gemini API key format
    console.log('🤖 Using Google Gemini adapter');
    return new GeminiAdapter(apiKey, model);
  } else if (apiKey.startsWith('sk-')) {
    // OpenAI API key format
    console.log('🤖 Using OpenAI adapter');
    return new OpenAIAdapter(apiKey, model);
  } else if (apiKey.startsWith('sk-ant-')) {
    // Anthropic API key format
    console.log('🤖 Using Anthropic adapter');
    return new AnthropicAdapter(apiKey, model);
  } else {
    // Default to Gemini for development
    console.log('⚠️  Unknown API key format, defaulting to Gemini adapter');
    return new GeminiAdapter(apiKey, model);
  }
}

export const llm: AIProvider = createLLMProvider();

// ============================================================================
// Agent Prompt Templates
// ============================================================================

/**
 * Mentor Agent - Calm financial guide
 * Plain language, explains outcomes, no stock tips
 */
export function mentorPrompt(context: AgentContext): PromptTemplate {
  const { playerRole: role, mood, health, scenarioDescription: situation, currentBalance } = context;
  const checking = currentBalance || 0;
  const savings = (context as any).savings || 0;
  const investments = (context as any).investments || 0;
  const debt = (context as any).debt || 0;

  // Adapt tone based on mood
  let toneGuidance = '';
  if (mood === 'anxious') {
    toneGuidance = 'The player is feeling anxious. Be extra reassuring, patient, and break steps down simply. Emphasize small wins.';
  } else if (mood === 'confident') {
    toneGuidance = 'The player is feeling confident. Acknowledge their positive momentum but gently caution against overconfidence and impulsive decisions.';
  } else {
    toneGuidance = 'The player is feeling okay. Maintain balanced, encouraging tone.';
  }

  return {
    system: `You are Mentor, a calm, friendly money coach. Use simple, non-judgmental language. 
No stock tips or predictions. Focus on teaching the concept behind the outcome. 
Keep replies under 120 words. Avoid jargon; if a term appears, define it briefly.
${toneGuidance}`,
    user: `Context:
- Role: ${role || 'player'}
- Mood: ${mood || 'neutral'}
- Health: ${health || 'unknown'}
- Situation: ${situation || 'financial decision'}
- Balances: checking $${checking}, savings $${savings}, investments $${investments}, debt $${debt}
Explain what just happened and one next small step the player can try.`,
  };
}

/**
 * Spender Sam Agent - Fun-first with awareness
 * Acknowledges trade-offs, validates enjoyment
 */
export function spenderSamPrompt(context: AgentContext): PromptTemplate {
  let toneAdjustment = '';
  if (context.mood === 'anxious') {
    toneAdjustment = 'The player is anxious. Be supportive but don\'t push spending. Acknowledge it\'s okay to say no.';
  } else if (context.mood === 'confident') {
    toneAdjustment = 'The player is confident. Celebrate fun but gently remind them that YOLO doesn\'t mean broke tomorrow.';
  }

  return {
    system: `You are Spender Sam. You love fun and instant rewards but acknowledge trade-offs. 
Keep tone upbeat and short (<100 words). No shaming. No stock tips.
${toneAdjustment}`,
    user: `Context: Player has $${context.currentBalance || '??'} available.
Mood: ${context.mood || 'neutral'}
Scenario: ${context.scenarioDescription || 'spending opportunity'}

What do you think about this situation? Should I go for it?`,
  };
}

/**
 * Saver Siya Agent - Conservative planner
 * Emphasizes emergency fund, planning, security
 */
export function saverSiyaPrompt(context: AgentContext): PromptTemplate {
  return {
    system: `You are Saver Siya. You like plans, cushions, and steady progress. 
Offer a safe option and a tiny habit to try (<100 words). No jargon.`,
    user: `Context: Player's current balance: $${context.currentBalance || '??'}
Recent decisions: ${context.recentDecisions?.join(', ') || 'just starting'}
Scenario: ${context.scenarioDescription || 'financial decision'}

What would you suggest from a savings perspective?`,
  };
}

/**
 * Crisis Coach Agent - Emergency triage specialist
 * Step-by-step for tough situations, warns about debt traps
 */
export function crisisCoachPrompt(context: AgentContext): PromptTemplate {
  let moodSupport = '';
  if (context.mood === 'anxious') {
    moodSupport = 'The player is anxious about this crisis. Be extra calm and reassuring. Break steps into tiny, manageable pieces.';
  } else if (context.mood === 'confident') {
    moodSupport = 'The player seems confident. Validate their strength but ensure they take the crisis seriously - no shortcuts.';
  }

  return {
    system: `You are Crisis Coach. Triage first: housing, food, essentials, minimum debt payments. 
Speak step-by-step, calm and brief (<120 words). No stock tips.
${moodSupport}`,
    user: `Context: Player is in ${context.difficulty || 'challenging'} mode.
Mood: ${context.mood || 'neutral'}
Situation: ${context.scenarioDescription || 'financial pressure'}

I'm facing this challenge. What should I prioritize first?`,
  };
}

/**
 * Future You Agent - Outcome projector
 * Shows 3-6 month projections based on current trends
 */
export function futureYouPrompt(context: AgentContext): PromptTemplate {
  return {
    system: `You are Future You. Show two 3–6 month outcomes based on current habits vs small improvements. 
Keep it concrete and short (<120 words).`,
    user: `Context: Current balance: $${context.currentBalance || '??'}
Recent pattern: ${context.recentDecisions?.slice(-3).join(', ') || 'just starting'}

If I continue with similar decisions regarding: ${context.scenarioDescription || 'this choice'}

Where might I be in 3-6 months?`,
  };
}

/**
 * Translator Agent - Jargon buster
 * Defines financial terms with everyday examples
 */
export function translatorPrompt(term: string, context: AgentContext): PromptTemplate {
  return {
    system: `You are the Translator. Define money terms in plain words and give a one-sentence everyday example. 
Stay under 60 words.`,
    user: `Context: Player is ${context.playerRole || 'learning'} about finance.

Explain this financial term in simple language: "${term}"

What does it mean and how does it work in everyday life?`,
  };
}

// ============================================================================
// Agent Reply Generator
// ============================================================================

export type AgentName =
  | 'mentor'
  | 'spenderSam'
  | 'saverSiya'
  | 'crisisCoach'
  | 'futureYou'
  | 'translator';

export interface AgentReply {
  agent: string;
  message: string;
  tokens?: number;
}

/**
 * Generate an agent reply using the appropriate prompt template
 * Enforces style guidelines: ≤120 words, no jargon, educational tone
 */
export async function generateAgentReply(
  agentName: AgentName,
  context: AgentContext,
  term?: string
): Promise<AgentReply> {
  // Select the appropriate prompt template
  let template: PromptTemplate;

  switch (agentName) {
    case 'mentor':
      template = mentorPrompt(context);
      break;
    case 'spenderSam':
      template = spenderSamPrompt(context);
      break;
    case 'saverSiya':
      template = saverSiyaPrompt(context);
      break;
    case 'crisisCoach':
      template = crisisCoachPrompt(context);
      break;
    case 'futureYou':
      template = futureYouPrompt(context);
      break;
    case 'translator':
      if (!term) {
        throw new AIServiceError('Translator agent requires a term parameter');
      }
      template = translatorPrompt(term, context);
      break;
    default:
      throw new AIServiceError(`Unknown agent: ${agentName}`);
  }

  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: template.system },
    { role: 'user', content: template.user },
  ];

  // Call LLM with constrained parameters
  try {
    const response = await llm.chat(messages, {
      temperature: 0.7,
      maxTokens: 800, // Increased for Gemini 2.5 Flash thinking tokens + output
    });

    return {
      agent: agentName,
      message: response.text.trim(),
      tokens: response.tokens,
    };
  } catch (error) {
    throw new AIServiceError(
      `Failed to generate ${agentName} reply: ${(error as Error).message}`,
      agentName
    );
  }
}

/**
 * Utility: Generate replies from multiple agents in parallel
 * Useful for showing different perspectives on the same scenario
 */
export async function generateMultipleAgentReplies(
  agents: AgentName[],
  context: AgentContext,
  term?: string
): Promise<AgentReply[]> {
  const replies = await Promise.allSettled(
    agents.map((agent) => generateAgentReply(agent, context, term))
  );

  return replies
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<AgentReply>).value);
}
