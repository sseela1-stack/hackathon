# Financial Mentor Chat Integration

## Overview
The Financial Mentor Chat is an interactive AI-powered advisor that provides context-aware financial guidance using Azure OpenAI GPT-4. It knows your current financial situation and provides personalized advice.

## Features

### 🎯 Context-Aware Advice
The mentor has real-time access to:
- Checking, Savings, and Investment account balances
- Financial Health Score (0-100)
- Monthly fixed expenses (rent, food, transport, phone/internet)
- Current mood (anxious, okay, confident)
- Months played in the game

### 💬 Chat Interface
- **Real-time conversation** with Azure GPT-4
- **Quick questions** for instant guidance
- **Conversation history** maintained during session
- **Financial-focused** - only answers money-related questions
- **Mobile-responsive** design with smooth animations

### 🔒 Safety Features
- Politely declines off-topic questions
- Maintains professional, educational tone
- Provides fallback responses if API fails
- Risk-appropriate advice based on user's financial health

## How to Use

### Accessing the Chat
1. Click the **"💡 Ask for Advice"** button in the DialoguePanel
2. The chat modal opens with a welcome message
3. Start typing your financial question

### Quick Start Questions
The chat suggests quick questions like:
- "Should I save or invest this month?"
- "How can I improve my financial health?"
- "What's my spending looking like?"
- "Tips for building emergency fund?"

### Example Interactions

**User**: "Should I save or invest this month?"  
**Mentor**: "Based on your current savings of $250 and financial health score of 62/100, I recommend focusing on building your emergency fund first. Aim for at least 3 months of expenses ($X) before investing. Your stability comes first! 💰"

**User**: "How can I reduce my rent?"  
**Mentor**: "With your rent at $X/month, here are some strategies:
1. Consider getting a roommate to split costs
2. Look for apartments in less trendy neighborhoods
3. Negotiate with your landlord for a longer lease
4. Check if utilities are included in other listings
Start with option 1 - it can cut your rent by 40-50%!"

**User**: "Tell me a joke"  
**Mentor**: "I'm here to help with your finances! Let's focus on your money goals, budgeting, saving, or investing. What financial question can I help you with today?"

## Technical Implementation

### Backend API

**Endpoint**: `POST /api/game/chat`

**Request Body**:
```json
{
  "message": "Should I save or invest?",
  "conversationHistory": [
    { "role": "user", "content": "Previous message..." },
    { "role": "assistant", "content": "Previous response..." }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "response": "Based on your current savings...",
  "timestamp": "2024-11-15T03:41:47.123Z"
}
```

### Azure OpenAI Configuration

**Environment Variables** (`.env`):
```env
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://models.inference.ai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

**Model Settings**:
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 300 (concise responses)
- Top P: 0.9 (diverse vocabulary)

### System Prompt
The mentor uses a carefully crafted system prompt that includes:
1. Current financial snapshot (all account balances, health score)
2. Behavioral guidelines (financial focus, empathetic tone)
3. Example interactions
4. Off-topic handling strategy

See `backend/src/services/azureChatService.ts` for full prompt.

## UI Components

### ChatPanel Component
**Location**: `frontend/src/components/ChatPanel.tsx`

**Features**:
- Message history with user/assistant styling
- Auto-scroll to latest message
- Typing indicator during AI response
- Quick question suggestions
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Close button to dismiss

**Styling**: `ChatPanel.module.css`
- Gradient purple header
- White message bubbles for assistant
- Purple gradient bubbles for user
- Smooth slide-up animation on open
- Responsive design (full-screen on mobile)

### Integration in GameScreen
The chat is triggered by clicking "Ask for Advice" in the DialoguePanel, which:
1. Completes the `q.askMentor` quest
2. Opens the ChatPanel modal
3. Maintains conversation history

## Investing District Unlock

The Investing District is now **always visible** in the navigation bar. Users can access it anytime without meeting health/savings requirements.

**Changes Made**:
- Removed conditional rendering of Investing button
- Updated `App.tsx` to always show 📈 Investing tab
- Prefetch InvestingDistrict chunk immediately

## Testing the Chat

### Local Development
1. Ensure backend is running: `cd backend && npm start`
2. Ensure frontend is running: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Click "💡 Ask for Advice" button
5. Start chatting!

### Testing Scenarios
- ✅ Ask financial questions (should get detailed answers)
- ✅ Ask off-topic questions (should politely decline)
- ✅ Send multiple messages (history should be maintained)
- ✅ Test quick questions (should pre-fill input)
- ✅ Close and reopen chat (should start fresh)
- ✅ Test on mobile (should be full-screen)

### Error Handling
- If Azure API fails, mentor provides fallback advice based on financial health score
- Network errors show user-friendly message
- Invalid responses handled gracefully

## Cost Optimization

### Token Usage
- System prompt: ~250 tokens
- Average user message: ~20 tokens
- Average assistant response: ~100-150 tokens
- **Total per exchange**: ~400 tokens

### Cost Estimate (Azure GPT-4)
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- **Per chat message**: ~$0.01-0.02
- **100 messages**: ~$1-2

### Optimization Strategies
1. Limit conversation history to last 5 exchanges
2. Use shorter system prompt for returning users
3. Cache common questions/responses
4. Set max_tokens to 300 (prevents runaway costs)
5. Consider GPT-3.5-turbo for lower costs ($0.001-0.002 per message)

## Future Enhancements

### Phase 2
- [ ] Suggested follow-up questions based on context
- [ ] Voice input/output for accessibility
- [ ] Multi-language support
- [ ] Save favorite conversations
- [ ] Share advice snippets

### Phase 3
- [ ] Mentor personality customization
- [ ] Financial literacy quiz integration
- [ ] Goal tracking with mentor reminders
- [ ] Comparison with similar users (anonymized)
- [ ] Achievement badges for asking good questions

## Troubleshooting

### Chat not opening
- Check browser console for errors
- Verify `handleAskMentor` is called in GameScreen
- Check `showChat` state

### No response from mentor
- Verify Azure API key in `.env`
- Check backend logs for API errors
- Test endpoint directly with curl:
  ```bash
  curl -X POST http://localhost:4000/api/game/chat \
    -H "Content-Type: application/json" \
    -H "x-player-id: dev-player-001" \
    -d '{"message":"Test message"}'
  ```

### Slow responses
- Azure API can take 2-5 seconds
- Add loading indicator (already implemented)
- Consider caching common questions

### Rate limiting
- Azure has rate limits (varies by tier)
- Implement request throttling if needed
- Show user-friendly error: "Please wait a moment before asking again"

---

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Status**: ✅ Fully Functional
