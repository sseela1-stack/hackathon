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
  checkingBalance?: number;
  savingsBalance?: number;
  investmentBalance?: number;
  debtBalance?: number;
  health?: number;
  mood?: string;
  monthsPlayed?: number;
  playerName?: string;
  scenarioDescription?: string;
  eventDescription?: string;
  recentDecisions?: string[];
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
 * Azure OpenAI API Adapter
 * Supports Azure-hosted GPT models
 */
export class AzureOpenAIAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly deployment: string;
  private readonly apiVersion: string;

  constructor(endpoint: string, apiKey: string, deployment: string, apiVersion: string = '2024-02-15-preview') {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.deployment = deployment;
    this.apiVersion = apiVersion;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse> {
    try {
      const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: opts?.temperature ?? 0.7,
          max_tokens: opts?.maxTokens ?? 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIServiceError(
          `Azure OpenAI API error: ${response.statusText} - ${errorText}`,
          'azure-openai',
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
        `Azure OpenAI request failed: ${(error as Error).message}`,
        'azure-openai'
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
 * Priority: Azure OpenAI > Gemini > OpenAI > Anthropic
 */
function createLLMProvider(): AIProvider {
  // Check for Azure OpenAI first (preferred for reliability)
  if (env.azureOpenAI.endpoint && env.azureOpenAI.key && env.azureOpenAI.deployment) {
    console.log('🤖 Using Azure OpenAI adapter');
    console.log(`   Endpoint: ${env.azureOpenAI.endpoint}`);
    console.log(`   Deployment: ${env.azureOpenAI.deployment}`);
    return new AzureOpenAIAdapter(
      env.azureOpenAI.endpoint,
      env.azureOpenAI.key,
      env.azureOpenAI.deployment,
      env.azureOpenAI.apiVersion
    );
  }

  const apiKey = env.ai.apiKey;
  const model = env.ai.model;

  // Detect provider based on API key format
  if (apiKey.startsWith('AIza')) {
    // Google Gemini API key format
    console.log('🤖 Using Google Gemini adapter (fallback)');
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
// Domain Mentor Prompts
// ============================================================================

/**
 * Purchase Mentor (Decision Mentor) - Need vs want guidance
 */
export function purchaseMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const investments = context?.investmentBalance ?? 0;
  const totalLiquid = checking + savings;
  
  return {
    system: `You are the Purchase Mentor. You help users decide on purchases. Stay in scope: need vs want, timing, budget, cheaper/refurb options, sinking fund.

ALWAYS ask 1-2 clarifying questions first if the input is vague or missing key info (budget, urgency, alternatives considered).

Domain boundaries: If asked about investing (>12 months), say "That's for investingMentor. Want me to switch?" If asked about budgeting daily expenses, redirect to budgetMentor.

Safety: Educational only. No personalized financial advice. No stock tips.

Format: Respond with your main advice (≤120 words), then suggest 2-3 follow-up questions or quick action ideas as short phrases.`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Investments: $${investments.toFixed(2)}
- Total Available: $${totalLiquid.toFixed(2)}
Mood: ${context?.mood || 'neutral'}

Player's question: "${input}"

Help them think through this purchase decision considering their current financial situation.`,
  };
}

/**
 * Investing Mentor - Long-term, diversified basics
 */
export function investingMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const investments = context?.investmentBalance ?? 0;
  
  return {
    system: `You are the Investing Mentor. You teach long-term, diversified investing basics for goals 5+ years out.

NO stock/coin tips. NO market predictions. NO personalized advice. These are hard rules.

If the goal is <12 months away, explain: "For short-term goals, investing is risky—use a savings bucket instead. For long-term (5+ years), here's how diversified index investing works…"

If input mentions specific tickers/crypto picks, respond: "I can't provide specific picks. Here's how to think about diversified, long-term investing instead…"

Ask 1 clarifying question if needed (time horizon? risk comfort?). Keep ≤120 words.`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Already Invested: $${investments.toFixed(2)}
Mood: ${context?.mood || 'neutral'}

Player's question: "${input}"

Teach them investing concepts (no picks), considering their current financial foundation.`,
  };
}

/**
 * Budget Mentor - Day-to-day spending guidance
 */
export function budgetMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const investments = context?.investmentBalance ?? 0;
  const health = context?.health ?? 50;
  
  return {
    system: `You are the Budget Mentor. You help with day-to-day budgeting: mapping fixed/wants/savings, trimming expenses, building the first $100 buffer.

Ask 1 question to understand their current spending patterns if the input is vague.

Domain boundaries: For purchase decisions, redirect to purchaseMentor. For debt strategy, redirect to debtMentor. For income ideas, redirect to careerMentor.

Keep ≤120 words. End with one tiny habit they can start today (e.g., "Track one category this week").`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Investments: $${investments.toFixed(2)}
- Financial Health: ${health}/100
Mood: ${context?.mood || 'neutral'}
Months Played: ${context?.monthsPlayed || 0}

Player's question: "${input}"

Help them with budgeting basics considering their current finances and progress.`,
  };
}

/**
 * Debt Mentor - High-interest debt triage
 */
export function debtMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const debt = context?.debtBalance ?? 0;
  
  return {
    system: `You are the Debt Mentor. You help with debt: pay minimums first, avoid late fees, prioritize high APR (avalanche) or small balances (snowball).

Ask 1 question about their debts (balances, APRs, minimums) if info is missing.

Domain boundaries: For income ideas to pay debt faster, suggest careerMentor. For emergency situations, suggest safetyMentor.

NO shaming. Be supportive and concrete. Keep ≤120 words. Focus on next small step.`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Current Debt: $${debt.toFixed(2)}
Mood: ${context?.mood || 'neutral'}

Player's question: "${input}"

Help them navigate their debt situation with supportive, concrete advice.`,
  };
}

/**
 * Career Mentor - Safe income-boosting ideas
 */
export function careerMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const investments = context?.investmentBalance ?? 0;
  const totalAssets = checking + savings + investments;
  
  return {
    system: `You are the Career Mentor. You suggest safe, legal ways to earn more: extra shifts, freelance, micro-gigs, selling unused items, skill mini-projects.

Ask 1 question about time available and skills if the input is vague (e.g., "How many hours per week? Any specific skills?").

Domain boundaries: NO job promises. NO scams or unsafe methods. NO multi-level marketing. Only legitimate, time-boxed ideas.

Keep ≤120 words. Provide 2 actionable ideas with realistic time estimates (e.g., "Freelance writing: 5-10 hrs/week, $100-$300/month").`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Investments: $${investments.toFixed(2)}
- Total Assets: $${totalAssets.toFixed(2)}
- Financial Health: ${context?.health || 50}/100
Role: ${context?.playerRole || 'player'}
Mood: ${context?.mood || 'neutral'}

Player's question: "${input}"

Suggest safe ways to increase income based on their situation.`,
  };
}

/**
 * Safety Mentor - Emergency fund & crisis triage
 */
export function safetyMentorPrompt(input: string, context?: AgentContext): PromptTemplate {
  const checking = context?.checkingBalance ?? 0;
  const savings = context?.savingsBalance ?? 0;
  const totalLiquid = checking + savings;
  const health = context?.health ?? 50;
  
  return {
    system: `You are the Safety Mentor. You focus on safety nets: emergency fund basics, essential bills first (rent/food/utilities), basic insurance concepts.

If a crisis is detected (job loss, major expense, eviction threat), provide step-by-step triage calmly.

Domain boundaries: For specific debt payoff, redirect to debtMentor. For daily budgeting, redirect to budgetMentor.

Keep ≤120 words. Be calm and brief. Focus on immediate stability.`,
    user: `Player: ${context?.playerName || 'You'}
Current Financial Situation:
- Checking: $${checking.toFixed(2)}
- Savings: $${savings.toFixed(2)}
- Total Emergency Fund: $${totalLiquid.toFixed(2)}
- Financial Health: ${health}/100
Mood: ${context?.mood || 'neutral'}
${context?.eventDescription ? `\nCurrent Situation: ${context.eventDescription}` : ''}

Player's question: "${input}"

Help them build safety and handle crises with their current resources.`,
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
  | 'translator'
  | 'purchaseMentor'
  | 'investingMentor'
  | 'budgetMentor'
  | 'debtMentor'
  | 'careerMentor'
  | 'safetyMentor';

export interface MentorReply {
  text: string;
  followUps?: string[];
  suggestions?: string[];
  domain: 'purchase' | 'investing' | 'budget' | 'debt' | 'career' | 'safety';
}

export interface AgentReply {
  agent: string;
  message: string;
  rich?: MentorReply;
  tokens?: number;
}

/**
 * Generate an agent reply using the appropriate prompt template
 * Enforces style guidelines: ≤120 words, no jargon, educational tone
 * Domain mentors support optional input parameter
 */
export async function generateAgentReply(
  agentName: AgentName,
  context: AgentContext,
  term?: string,
  input?: string
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
    case 'purchaseMentor':
      if (!input) {
        throw new AIServiceError('purchaseMentor requires an input parameter');
      }
      template = purchaseMentorPrompt(input, context);
      break;
    case 'investingMentor':
      if (!input) {
        throw new AIServiceError('investingMentor requires an input parameter');
      }
      template = investingMentorPrompt(input, context);
      break;
    case 'budgetMentor':
      if (!input) {
        throw new AIServiceError('budgetMentor requires an input parameter');
      }
      template = budgetMentorPrompt(input, context);
      break;
    case 'debtMentor':
      if (!input) {
        throw new AIServiceError('debtMentor requires an input parameter');
      }
      template = debtMentorPrompt(input, context);
      break;
    case 'careerMentor':
      if (!input) {
        throw new AIServiceError('careerMentor requires an input parameter');
      }
      template = careerMentorPrompt(input, context);
      break;
    case 'safetyMentor':
      if (!input) {
        throw new AIServiceError('safetyMentor requires an input parameter');
      }
      template = safetyMentorPrompt(input, context);
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

    const messageText = response.text.trim();
    
    // For domain mentors, create rich responses with suggestions
    const domainMentors = ['purchaseMentor', 'investingMentor', 'budgetMentor', 'debtMentor', 'careerMentor', 'safetyMentor'];
    if (domainMentors.includes(agentName)) {
      const domainMap: Record<string, 'purchase' | 'investing' | 'budget' | 'debt' | 'career' | 'safety'> = {
        purchaseMentor: 'purchase',
        investingMentor: 'investing',
        budgetMentor: 'budget',
        debtMentor: 'debt',
        careerMentor: 'career',
        safetyMentor: 'safety',
      };
      
      // Generate contextual follow-ups based on domain
      const followUpMap: Record<string, string[]> = {
        purchaseMentor: ["Is this a need or want?", "Can I wait 30 days?", "Are there cheaper alternatives?"],
        investingMentor: ["Do I have emergency savings?", "What's my timeline?", "Should I learn more first?"],
        budgetMentor: ["What's my biggest expense?", "Can I cut anything?", "How do I track spending?"],
        debtMentor: ["What are my interest rates?", "Can I pay extra?", "Should I consolidate?"],
        careerMentor: ["What skills do I have?", "How much time can I spare?", "What's realistic income?"],
        safetyMentor: ["Do I have $500 saved?", "What are my essentials?", "Who can I ask for help?"],
      };
      
      const suggestionMap: Record<string, string[]> = {
        purchaseMentor: ["Start a sinking fund", "Try the 24-hour rule", "Check refurbished options"],
        investingMentor: ["Build emergency fund first", "Learn about index funds", "Start with 1% of income"],
        budgetMentor: ["Try 50/30/20 rule", "Track one week of spending", "Find one expense to cut"],
        debtMentor: ["List all debts by rate", "Pay minimums + extra to one", "Call creditors if struggling"],
        careerMentor: ["Update skills list", "Check freelance sites", "Ask about overtime"],
        safetyMentor: ["Save $20 this week", "List essential expenses", "Find local resources"],
      };
      
      return {
        agent: agentName,
        message: messageText,
        rich: {
          text: messageText,
          followUps: followUpMap[agentName] || [],
          suggestions: suggestionMap[agentName] || [],
          domain: domainMap[agentName],
        },
        tokens: response.tokens,
      };
    }

    return {
      agent: agentName,
      message: messageText,
      tokens: response.tokens,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    // If rate limited, provide helpful fallback responses
    if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      // Generate dynamic fallback based on user input
      const userQuestion = input || 'your question';
      
      const fallbackResponses: Record<AgentName, string> = {
        mentor: `I'm here to help with "${userQuestion}"! Think about your financial goals - what matters most to you right now? I can guide you on budgeting, saving, debt, and more.`,
        purchaseMentor: `Great question about "${userQuestion}"! Let me help: Is this a need or a want? Can you afford it without affecting essentials? Will you still value this in 30 days? Consider waiting 24 hours before deciding.`,
        investingMentor: `Good thinking about "${userQuestion}"! Key principle: start with emergency savings first (3-6 months expenses), then consider low-cost index funds for long-term goals (5+ years). Never invest money you'll need soon.`,
        budgetMentor: `Let's tackle "${userQuestion}"! Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. What's your biggest spending category? Even cutting $5/day saves $150/month! Track your spending for one week to find opportunities.`,
        debtMentor: `I understand you're asking about "${userQuestion}". Strategy: pay minimums on everything, then focus extra payments using avalanche method (highest interest first) or snowball method (smallest balance first for motivation). You've got this!`,
        careerMentor: `Regarding "${userQuestion}" - let's explore options! Consider: What skills do you have? Ideas: freelancing (Upwork, Fiverr), tutoring, pet sitting, food delivery. Start small - even $100-200/month helps build momentum.`,
        safetyMentor: `About "${userQuestion}" - financial safety first! Your emergency fund goal: $500-1000 for starters, then 3-6 months of expenses. Priority order: 1) Keep essentials paid, 2) Build small buffer, 3) Avoid high-interest debt.`,
        spenderSam: `Hey, about "${userQuestion}" - I usually say go for it, but let's think... Can you afford this without touching emergency savings? Will it bring lasting joy? Sometimes waiting 24 hours helps clarify!`,
        saverSiya: `Hi! Regarding "${userQuestion}" - every dollar saved is a step toward security. Small consistent savings add up! Even $20/week becomes $1,040/year. What's one small expense you could reduce this week?`,
        crisisCoach: `I'm here for you with "${userQuestion}". In crisis: 1) Breathe - you'll get through this, 2) Prioritize: food, shelter, utilities, minimum debt payments, 3) Contact creditors to explain - many have hardship programs.`,
        futureYou: `Thinking about "${userQuestion}" - imagine yourself 5 years from now. What financial decisions would they thank you for today? Small consistent actions compound: saving, learning, avoiding bad debt.`,
        translator: `Happy to explain "${userQuestion}" in plain language! Financial terms can be confusing, but I'll break it down without the jargon. What specific term would you like me to explain?`,
      };
      
      const domainMentors = ['purchaseMentor', 'investingMentor', 'budgetMentor', 'debtMentor', 'careerMentor', 'safetyMentor'];
      if (domainMentors.includes(agentName)) {
        const domainMap: Record<string, 'purchase' | 'investing' | 'budget' | 'debt' | 'career' | 'safety'> = {
          purchaseMentor: 'purchase',
          investingMentor: 'investing',
          budgetMentor: 'budget',
          debtMentor: 'debt',
          careerMentor: 'career',
          safetyMentor: 'safety',
        };
        
        return {
          agent: agentName,
          message: fallbackResponses[agentName] || "Our AI mentor is temporarily busy. Please try again in a moment!",
          rich: {
            text: fallbackResponses[agentName] || "Our AI mentor is temporarily busy. Please try again in a moment!",
            followUps: ["Try again", "Ask something else", "Switch mentor"],
            suggestions: [],
            domain: domainMap[agentName],
          },
          tokens: 0,
        };
      }
      
      return {
        agent: agentName,
        message: fallbackResponses[agentName] || "Our AI mentor is temporarily busy. Please try again in a moment!",
        tokens: 0,
      };
    }
    
    throw new AIServiceError(
      `Failed to generate ${agentName} reply: ${errorMessage}`,
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
