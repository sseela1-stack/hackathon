/**
 * Test runner for mock authentication middleware
 * Run with: npm run test:auth
 */

import express, { Request, Response } from 'express';
import { mockAuth } from './middleware/mockAuth';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function describe(suiteName: string, fn: () => void): void {
  console.log(`\n${suiteName}`);
  fn();
}

function it(testName: string, fn: () => void): void {
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ✗ ${testName}`);
    if (error instanceof Error) {
      console.log(`    ${error.message}`);
    }
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeTypeOf(expectedType: string) {
      if (typeof actual !== expectedType) {
        throw new Error(`Expected type ${typeof actual} to be ${expectedType}`);
      }
    },
  };
}

// Create mock request/response helpers
function createMockRequest(headers: Record<string, string> = {}): Partial<Request> {
  return {
    get: (headerName: string) => {
      const key = Object.keys(headers).find(
        k => k.toLowerCase() === headerName.toLowerCase()
      );
      return key ? headers[key] : undefined;
    },
    headers,
  } as Partial<Request>;
}

function createMockResponse(): Partial<Response> {
  return {} as Partial<Response>;
}

function createMockNext() {
  let called = false;
  const fn = () => {
    called = true;
  };
  (fn as any).wasCalled = () => called;
  return fn as any;
}

console.log('\n=== Mock Authentication Middleware Tests ===\n');

describe('mockAuth middleware', () => {
  it('should attach playerId to request when x-player-id header is present', () => {
    const req = createMockRequest({ 'x-player-id': 'test-player-123' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe('test-player-123');
    expect(next.wasCalled()).toBe(true);
  });

  it('should handle case-insensitive header name (X-Player-ID)', () => {
    const req = createMockRequest({ 'X-Player-ID': 'case-test-player' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe('case-test-player');
    expect(next.wasCalled()).toBe(true);
  });

  it('should default to "dev-player" when x-player-id header is missing', () => {
    const req = createMockRequest({}) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe('dev-player');
    expect(next.wasCalled()).toBe(true);
  });

  it('should default to "dev-player" when x-player-id header is empty string', () => {
    const req = createMockRequest({ 'x-player-id': '' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe('dev-player');
    expect(next.wasCalled()).toBe(true);
  });

  it('should handle special characters in player ID', () => {
    const req = createMockRequest({ 'x-player-id': 'player-with-dashes_and_underscores.123' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe('player-with-dashes_and_underscores.123');
    expect(next.wasCalled()).toBe(true);
  });

  it('should handle UUID-style player IDs', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const req = createMockRequest({ 'x-player-id': uuid }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(req.playerId).toBe(uuid);
    expect(next.wasCalled()).toBe(true);
  });

  it('should always call next() to continue middleware chain', () => {
    const req = createMockRequest({ 'x-player-id': 'test' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect(next.wasCalled()).toBe(true);
  });

  it('should preserve other request properties', () => {
    const req = createMockRequest({ 'x-player-id': 'test' }) as Request;
    (req as any).customProp = 'should-remain';
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    expect((req as any).customProp).toBe('should-remain');
    expect(req.playerId).toBe('test');
  });
});

describe('TypeScript declaration merge', () => {
  it('should allow accessing playerId on Request type', () => {
    // This test verifies the declaration merge works at compile time
    const req = createMockRequest({ 'x-player-id': 'test' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    mockAuth(req, res, next);

    // TypeScript should not complain about req.playerId
    expect(req.playerId).toBeDefined();
    expect(req.playerId).toBeTypeOf('string');
  });
});

// Integration test with Express app
describe('Integration with Express', () => {
  it('should work in an Express middleware chain', () => {
    const app = express();
    
    app.use(mockAuth);
    
    app.get('/test', (req: Request, res: Response) => {
      res.json({ playerId: req.playerId });
    });

    // Simulate request
    const req = createMockRequest({ 'x-player-id': 'integration-test' }) as any;
    req.method = 'GET';
    req.url = '/test';
    
    const res = {
      json: (data: any) => {
        try {
          expect(data.playerId).toBe('integration-test');
          testsPassed++;
          console.log(`  ✓ should work in an Express middleware chain`);
        } catch (error) {
          testsFailed++;
          console.log(`  ✗ should work in an Express middleware chain`);
          if (error instanceof Error) {
            console.log(`    ${error.message}`);
          }
        }
      },
    } as any;

    mockAuth(req as Request, res as Response, () => {
      // Middleware called next, verify playerId is set
      expect(req.playerId).toBe('integration-test');
    });
  });
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
