# Mock Authentication Implementation

## Overview
Lightweight mock authentication middleware for development that reads `x-player-id` header and attaches it to the Express Request object.

**⚠️ TODO: Replace with JWT-based authentication in production**

## Files Created

### 1. `backend/src/middleware/mockAuth.ts`
Mock authentication middleware with TypeScript declaration merge.

```typescript
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      playerId: string;
    }
  }
}

export function mockAuth(req: Request, res: Response, next: NextFunction): void {
  const headerPlayerId = req.get('x-player-id');
  req.playerId = headerPlayerId || 'dev-player';
  next();
}
```

### 2. Updated `backend/src/index.ts`
- Added `mockAuth` import
- Mounted globally before routes
- Added `X-Player-ID` to CORS allowed headers

## Features

✅ **Header-based identification**: Reads `x-player-id` header (case-insensitive)  
✅ **Default fallback**: Uses `"dev-player"` if header is missing or empty  
✅ **TypeScript support**: Declaration merge adds `playerId` to Request type  
✅ **Global middleware**: Mounted before all routes, available everywhere  
✅ **CORS configured**: `X-Player-ID` added to allowed headers

## Usage

### In API Requests
```bash
# With player ID header
curl -H "x-player-id: player-123" http://localhost:3001/api/game/state

# Without header (defaults to "dev-player")
curl http://localhost:3001/api/game/state
```

### In Route Handlers
```typescript
import { Request, Response } from 'express';

export function myHandler(req: Request, res: Response) {
  // Access playerId directly - TypeScript knows it exists!
  const playerId = req.playerId; // Type: string
  
  console.log(`Request from player: ${playerId}`);
  
  res.json({
    message: `Hello, ${playerId}!`
  });
}
```

### Example: Game State Controller
```typescript
export async function getGameState(req: Request, res: Response) {
  const playerId = req.playerId; // "dev-player" or header value
  
  // Load state for this specific player
  const state = await gameRepo.loadState(playerId);
  
  res.json({ state });
}
```

## Test Coverage

### Test Suite (`backend/src/test-auth.ts`)
```
✓ Attaches playerId from x-player-id header
✓ Handles case-insensitive header names
✓ Defaults to "dev-player" when header missing
✓ Defaults to "dev-player" when header empty
✓ Handles special characters in player ID
✓ Handles UUID-style player IDs
✓ Always calls next() middleware
✓ Preserves other request properties
✓ TypeScript declaration merge works
✓ Integration with Express middleware chain

10/10 tests passing ✅
```

Run tests:
```bash
npm run test:auth
```

## Header Formats Supported

```bash
# Standard
x-player-id: player-123

# Case-insensitive
X-Player-ID: player-123
X-PLAYER-ID: player-123

# Special characters
x-player-id: player-with-dashes_and_underscores.123

# UUIDs
x-player-id: 550e8400-e29b-41d4-a716-446655440000

# Empty (defaults to "dev-player")
x-player-id: 
```

## Middleware Order

```typescript
app.use(helmet());           // 1. Security
app.use(cors());             // 2. CORS
app.use(express.json());     // 3. Body parsing
app.use(compression());      // 4. Compression
app.use(httpLogger);         // 5. Request logging
app.use(mockAuth);           // 6. Mock auth ⭐
registerRoutes(app);         // 7. API routes
app.use(errorHandler);       // 8. Error handler
```

**Important**: `mockAuth` is mounted **before** routes, so `req.playerId` is available in all route handlers.

## Migration to JWT (Future)

When implementing JWT authentication:

1. Create `backend/src/middleware/jwtAuth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.playerId = decoded.sub as string;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

2. Replace in `index.ts`:
```typescript
// Development
if (env.nodeEnv === 'development') {
  app.use(mockAuth);
} else {
  app.use(jwtAuth);
}
```

3. Update CORS headers:
```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
```

## Benefits

🚀 **Fast development**: No auth setup needed for local testing  
🔧 **Easy debugging**: Simply set header to test different players  
📝 **Type-safe**: TypeScript knows `req.playerId` exists  
🧪 **Testable**: 10 tests ensure reliability  
⚡ **Zero overhead**: Single header read, no DB/token validation

## Limitations

⚠️ **Not production-ready**: No security, anyone can impersonate  
⚠️ **No validation**: Accepts any string as player ID  
⚠️ **No expiration**: Player ID never expires  
⚠️ **No scopes/roles**: All players have same permissions

**Use only in development. Replace with JWT before production.**
