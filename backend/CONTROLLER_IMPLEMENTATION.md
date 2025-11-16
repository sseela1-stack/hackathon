# Game Controller Implementation

## ✅ Complete Implementation

### Overview
Implemented three REST API endpoints for game state management with in-memory storage, Zod validation, and comprehensive error handling.

---

## 📁 Files Created/Updated

### 1. `src/store.ts` (NEW)
**In-memory game state repository**

Simple Map-based storage for temporary state persistence:

```typescript
const gameStateStore = new Map<string, GameState>();

export function getGameState(playerId: string): GameState | undefined
export function saveGameState(playerId: string, state: GameState): void
export function deleteGameState(playerId: string): boolean
export function hasGameState(playerId: string): boolean
export function getAllPlayerIds(): string[]
export function clearAllGameStates(): void
export function getStoreStats()
```

**Features:**
- Type-safe key-value store
- CRUD operations for game states
- Utility functions for testing and debugging
- Will be replaced with database later

---

### 2. `src/controllers/gameController.ts` (UPDATED)
**Three complete controller handlers**

#### Handler 1: `GET /api/game/state`
**Returns current game state or initializes new game**

**Headers:**
- `x-player-id` (optional) - Player identifier, defaults to `dev-player-001`

**Response (200):**
```json
{
  "success": true,
  "state": { /* GameState object */ },
  "playerId": "test-player-123"
}
```

**Behavior:**
1. Extracts player ID from header or uses default
2. Checks if player exists in store
3. If not exists: initializes with defaults:
   - Role: `student`
   - Difficulty: `normal`
   - Mood: `okay`
   - Health: 50
   - Fixed costs from role defaults
   - Income plan computed
   - Initial accounts (checking/savings/investment)
   - First scenario generated
4. Returns game state

**Error Handling (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve game state",
  "message": "Error details"
}
```

---

#### Handler 2: `POST /api/game/choice`
**Process player's choice and update game state**

**Headers:**
- `x-player-id` (optional) - Player identifier

**Request Body (validated with Zod):**
```json
{
  "scenarioId": "scenario-1234",
  "choiceId": "scenario-1234-choice-1",
  "mood": "okay" // optional: "anxious" | "okay" | "confident"
}
```

**Response (200):**
```json
{
  "success": true,
  "state": { /* Updated GameState */ },
  "applied": {
    "choice": "Pay on time from checking",
    "consequences": {
      "bankDelta": -85,
      "savingsDelta": 0,
      "debtDelta": 0,
      "investDelta": 0,
      "healthDelta": 3,
      "notes": "Paid bill on time..."
    }
  },
  "unlocked": ["investingDistrict"] // if newly unlocked
}
```

**Processing Steps:**
1. Validates request body with Zod schema
2. Loads current game state
3. Validates scenario ID matches `lastScenario`
4. Generates available choices
5. Validates selected choice exists
6. Applies choice using `resolveChoice()`
7. Updates mood if provided
8. **Recalculates income plan** for next month
9. **Recalculates health score** from history metrics:
   - On-time payment ratio (last 10 decisions)
   - Average savings delta
   - Total debt accumulated
   - Held through market crashes
10. Checks if investing district should unlock
11. Persists updated state
12. Returns full updated state

**Error Responses:**

**400 - Invalid Request:**
```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [/* Zod validation errors */]
}
```

**400 - Invalid Scenario:**
```json
{
  "success": false,
  "error": "Invalid scenario ID",
  "message": "Expected scenario ID: scenario-xyz"
}
```

**400 - Invalid Choice:**
```json
{
  "success": false,
  "error": "Invalid choice ID",
  "message": "Choice not found for this scenario",
  "availableChoices": [
    { "id": "...", "label": "..." }
  ]
}
```

**404 - No Game State:**
```json
{
  "success": false,
  "error": "Game state not found",
  "message": "Please initialize a game first by calling GET /api/game/state"
}
```

---

#### Handler 3: `GET /api/game/playbook`
**Generate personalized financial patterns and tips**

**Headers:**
- `x-player-id` (optional) - Player identifier

**Response (200):**
```json
{
  "success": true,
  "playbook": {
    "patterns": [
      "You often choose immediate enjoyment over long-term savings",
      "You successfully avoid taking on debt"
    ],
    "tips": [
      "Try a 24-hour rule: wait a day before making discretionary purchases",
      "Aim to save 3-6 months of expenses in your emergency fund"
    ],
    "summary": {
      "totalDecisions": 12,
      "healthScore": 67,
      "currentBalances": {
        "checking": 850,
        "savings": 1200,
        "investment": 300
      },
      "investingUnlocked": true
    }
  }
}
```

**Pattern Analysis Logic:**

1. **Spending behavior** (>50% discretionary = spender, <20% = saver)
2. **Debt usage** (>2 debt choices = frequent credit user)
3. **Emergency fund usage** (>3 withdrawals = over-reliance)
4. **Bill payment behavior** (late payments detected)
5. **Investment discipline** (panic selling vs holding)

**Tip Generation Logic:**

Based on detected patterns:
- Health < 40 → Focus on basics (bills, emergency fund)
- Health 40-60 → Work toward investing unlock
- Immediate gratification pattern → 24-hour rule
- Debt pattern → Build emergency buffer
- Emergency fund dipping → Use checking first
- Low emergency fund → 3-6 month goal
- Health ≥ 70 → Automate savings
- Investing unlocked → Start small ($50/month)

Returns **2-3 patterns** and **2-3 tips** maximum.

**Error Response (404):**
```json
{
  "success": false,
  "error": "Game state not found",
  "message": "Please initialize a game first..."
}
```

---

## 🧪 Test Results

### All 8 Integration Tests Passing ✅

**Test Suite:** `src/test-controller.ts`

```
✅ Initialize new game
✅ Retrieve existing game
✅ Make valid choice
✅ Reject invalid scenario
✅ Reject missing fields
✅ Generate playbook
✅ Full game flow (5 rounds)
✅ Default player ID
```

**Run tests:**
```bash
npm run test:controller
```

---

## 🔧 Technical Details

### Player ID Resolution
```typescript
function getPlayerId(req: Request): string {
  const playerId = req.headers['x-player-id'];
  if (typeof playerId === 'string' && playerId.length > 0) {
    return playerId;
  }
  return DEV_PLAYER_ID; // 'dev-player-001'
}
```

### Zod Validation Schema
```typescript
const postChoiceSchema = z.object({
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  choiceId: z.string().min(1, 'Choice ID is required'),
  mood: z.enum(['anxious', 'okay', 'confident']).optional(),
});
```

### Health Score Recalculation
```typescript
// Extract metrics from last 10 decisions
const recentHistory = newState.history.slice(-10);

// Calculate on-time payment ratio
const billPayments = recentHistory.filter(
  (h) => h.delta.bankDelta < 0 && Math.abs(h.delta.bankDelta) < 200
);
const onTimePayments = billPayments.filter((h) => h.delta.healthDelta >= 0);
const paymentsOnTimeRatio = billPayments.length > 0 
  ? onTimePayments.length / billPayments.length 
  : 1.0;

// Average savings delta
const avgSavingsDelta = recentHistory
  .map((h) => h.delta.savingsDelta)
  .reduce((sum, d) => sum + d, 0) / recentHistory.length;

// Total accumulated debt
const totalDebt = Math.max(0, 
  recentHistory.reduce((sum, h) => sum + h.delta.debtDelta, 0)
);

// Investment discipline (held through crashes)
const hadMarketCrash = newState.history.some((h) => 
  h.scenarioId.includes('marketCrash')
);
const panicSold = newState.history.some((h) => 
  h.choiceId.includes('panic') || h.choiceId.includes('sell')
);
const heldThroughVolatility = hadMarketCrash && !panicSold;

// Calculate final score
const healthScore = calculateHealthScore({
  paymentsOnTimeRatio,
  savingsDelta: avgSavingsDelta,
  income: totalIncome,
  debt: totalDebt,
  savings: savingsBalance,
  fixedCostsTotal,
  heldThroughVolatility,
});
```

---

## 📊 Example Request Flow

### 1. Initialize Game
```bash
curl http://localhost:3000/api/game/state \
  -H "x-player-id: alice-123"
```

**Response:** New game initialized with student role, scenario presented

### 2. Make Choice
```bash
curl -X POST http://localhost:3000/api/game/choice \
  -H "x-player-id: alice-123" \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "scenario-1700000000000-1234",
    "choiceId": "scenario-1700000000000-1234-choice-1",
    "mood": "confident"
  }'
```

**Response:** State updated, consequences applied, new scenario generated

### 3. Get Playbook
```bash
curl http://localhost:3000/api/game/playbook \
  -H "x-player-id: alice-123"
```

**Response:** Patterns and tips based on decision history

---

## 🚀 Integration with Routes

Update `src/routes/gameRoutes.ts`:

```typescript
import { Router } from 'express';
import { getGameState, postChoice, getPlaybook } from '../controllers/gameController';

const router = Router();

router.get('/state', getGameState);
router.post('/choice', postChoice);
router.get('/playbook', getPlaybook);

export default router;
```

---

## 🔐 Future Enhancements

### Ready to Add:
1. **Database persistence** - Replace `store.ts` with MongoDB/PostgreSQL
2. **Authentication middleware** - Validate JWT tokens for real user IDs
3. **Rate limiting** - Prevent choice spam
4. **Webhooks** - Notify on achievements/unlocks
5. **Analytics** - Track aggregate player patterns
6. **Multiplayer** - Leaderboards and comparisons

### Architecture Supports:
- Easy swap from in-memory to database (same interface)
- Player ID already extracted and validated
- All state updates are atomic and transactional
- Error handling centralized and consistent

---

## ✅ Implementation Checklist

- [x] `getState()` - Returns/initializes game state
- [x] `postChoice()` - Validates and processes choices
- [x] `getPlaybook()` - Generates patterns and tips
- [x] In-memory store module (`store.ts`)
- [x] Zod validation for request bodies
- [x] Player ID extraction from headers
- [x] Default dev player ID fallback
- [x] Income plan recalculation after each choice
- [x] Health score recalculation from history
- [x] Investing unlock detection
- [x] Pattern analysis (5 types)
- [x] Tip generation (contextual)
- [x] Comprehensive error handling
- [x] Integration test suite (8 tests)
- [x] All tests passing ✅

---

## 📝 API Documentation Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/game/state` | GET | Get/initialize game | Optional header |
| `/api/game/choice` | POST | Process choice | Optional header |
| `/api/game/playbook` | GET | Get patterns/tips | Optional header |

**Default Player ID:** `dev-player-001` (when `x-player-id` header absent)

**All responses:** JSON format with `success` boolean

**Error handling:** Centralized with proper status codes (400, 404, 500)

---

**Implementation complete and tested! 🎉**
