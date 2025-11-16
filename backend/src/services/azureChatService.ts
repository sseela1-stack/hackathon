/**
 * Gemini Chat Service
 * Provides context-aware financial mentoring via Google Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GameState } from '../models/GameState';

const apiKey = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Gemini client
 */
function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Build system prompt with game state context
 */
function buildSystemPrompt(gameState: GameState): string {
  const checking = gameState.accounts.find(a => a.type === 'checking')?.balance || 0;
  const savings = gameState.accounts.find(a => a.type === 'savings')?.balance || 0;
  const investment = gameState.accounts.find(a => a.type === 'investment')?.balance || 0;

  return `You are a friendly and knowledgeable Financial Mentor helping a young adult navigate their personal finances. Your role is to provide practical, empathetic, and actionable financial advice.

**Current Financial Snapshot:**
- Checking Account: $${checking.toFixed(2)}
- Savings Account: $${savings.toFixed(2)}
- Investment Account: $${investment.toFixed(2)}
- Financial Health Score: ${gameState.health}/100
- Monthly Fixed Expenses:
  * Rent: $${gameState.fixed.rent}
  * Food: $${gameState.fixed.food}
  * Transport: $${gameState.fixed.transport}
  * Phone/Internet: $${gameState.fixed.phoneInternet}
- Months Played: ${gameState.monthsPlayed}
- Mood: ${gameState.mood}

**Your Guidelines:**
1. **Financial Focus Only**: Only answer questions related to personal finance, budgeting, saving, investing, debt management, and financial literacy. Politely decline off-topic questions.

2. **Context-Aware**: Reference the user's actual financial data when giving advice. Be specific to their situation.

3. **Encouraging Tone**: Be supportive and celebrate small wins. Acknowledge challenges empathetically.

4. **Actionable Advice**: Provide concrete, step-by-step guidance they can implement immediately.

5. **Educational**: Explain financial concepts simply. Use analogies when helpful.

6. **Risk-Appropriate**: Tailor advice to their current financial health and experience level.

7. **Concise**: Keep responses under 150 words unless explaining complex concepts.

**Example Questions You Excel At:**
- "Should I save or invest this month?"
- "How can I build an emergency fund?"
- "What's a good budgeting strategy?"
- "How do I prioritize debt vs savings?"
- "Is my spending on track?"

**Off-Topic Response:**
"I'm here to help with your finances! Let's focus on your money goals, budgeting, saving, or investing. What financial question can I help you with today?"

Remember: You're not just giving advice—you're empowering them to build a healthier financial future. 💰`;
}

/**
 * Chat with Gemini using game state context
 */
export async function chatWithMentor(
  userMessage: string,
  gameState: GameState,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = buildSystemPrompt(gameState);

    console.log('🤖 Calling Gemini API');

    // Filter out initial assistant greeting if it exists, and ensure history starts with user
    let filteredHistory = conversationHistory.filter((msg, idx) => {
      // Remove first message if it's assistant role (initial greeting)
      if (idx === 0 && msg.role === 'assistant') return false;
      return true;
    });

    // If no history or empty after filtering, make a simple call
    if (filteredHistory.length === 0) {
      const fullMessage = `${systemPrompt}\n\nUser: ${userMessage}`;
      const result = await model.generateContent(fullMessage);
      const response = await result.response;
      console.log('✅ Gemini response received');
      return response.text() || "I'm here to help with your finances! What would you like to know?";
    }

    // With history, use chat mode
    // Convert history to Gemini format
    const history = filteredHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    
    console.log('✅ Gemini response received');

    return response.text() || "I'm here to help with your finances! What would you like to know?";
  } catch (error: any) {
    console.error('❌ Gemini chat error:', {
      message: error.message,
      status: error.status,
    });
    
    // Fallback response
    return `I apologize, but I'm having trouble connecting right now. However, based on your current financial health score of ${gameState.health}/100, I recommend focusing on ${
      gameState.health < 50 
        ? 'building your emergency fund and reducing expenses'
        : gameState.health < 70
        ? 'maintaining consistent savings and exploring investment options'
        : 'optimizing your investment strategy and long-term wealth building'
    }. Feel free to ask specific questions!`;
  }
}

/**
 * Validate Gemini configuration
 */
export function validateAzureConfig(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
