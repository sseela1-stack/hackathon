/**
 * Minimal tests for validation middleware
 * 
 * Run: npm run test:validate (after adding script to package.json)
 */

import { z } from 'zod';
import { validate, validateBody, validateParams, validateQuery } from './middleware/validate';
import { Request, Response, NextFunction } from 'express';

// Mock Express request/response/next
function createMockReq(data: any = {}): Request {
  return {
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
  } as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

function createMockNext(): { next: NextFunction; getError: () => any } {
  let capturedError: any = null;
  const next: NextFunction = (err?: any) => {
    if (err) capturedError = err;
  };
  return { 
    next, 
    getError: () => capturedError 
  };
}

console.log('🧪 Testing validation middleware...\n');

// Test 1: validateBody - success
{
  const schema = z.object({
    email: z.string().email(),
    age: z.number().positive(),
  });

  const req = createMockReq({
    body: { email: 'test@example.com', age: 25 },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateBody(schema)(req, res, mock.next);

  const error = mock.getError();
  if (!error) {
    console.log('✅ Test 1: validateBody success - passed');
  } else {
    console.log('❌ Test 1: validateBody success - failed');
    console.log('   Error:', error);
  }
}

// Test 2: validateBody - validation error
{
  const schema = z.object({
    email: z.string().email(),
  });

  const req = createMockReq({
    body: { email: 'invalid-email' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateBody(schema)(req, res, mock.next);

  const error = mock.getError();
  if (error && error.status === 400 && error.message.includes('email')) {
    console.log('✅ Test 2: validateBody error - passed');
    console.log('   Error message:', error.message);
  } else {
    console.log('❌ Test 2: validateBody error - failed');
    console.log('   Expected 400 error with email path');
  }
}

// Test 3: validateParams - success
{
  const schema = z.object({
    id: z.string().uuid(),
  });

  const req = createMockReq({
    params: { id: '550e8400-e29b-41d4-a716-446655440000' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateParams(schema)(req, res, mock.next);

  const error = mock.getError();
  if (!error) {
    console.log('✅ Test 3: validateParams success - passed');
  } else {
    console.log('❌ Test 3: validateParams success - failed');
    console.log('   Error:', error);
  }
}

// Test 4: validateParams - validation error
{
  const schema = z.object({
    id: z.string().uuid(),
  });

  const req = createMockReq({
    params: { id: 'not-a-uuid' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateParams(schema)(req, res, mock.next);

  const error = mock.getError();
  if (error && error.status === 400 && error.message.includes('id')) {
    console.log('✅ Test 4: validateParams error - passed');
    console.log('   Error message:', error.message);
  } else {
    console.log('❌ Test 4: validateParams error - failed');
    console.log('   Expected 400 error with id path');
  }
}

// Test 5: validateQuery - success with coercion
{
  const schema = z.object({
    page: z.coerce.number().positive(),
    limit: z.coerce.number().max(100),
  });

  const req = createMockReq({
    query: { page: '2', limit: '50' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateQuery(schema)(req, res, mock.next);

  const error = mock.getError();
  if (!error) {
    console.log('✅ Test 5: validateQuery success with coercion - passed');
  } else {
    console.log('❌ Test 5: validateQuery success with coercion - failed');
    console.log('   Error:', error);
  }
}

// Test 6: validateQuery - validation error
{
  const schema = z.object({
    limit: z.coerce.number().max(100),
  });

  const req = createMockReq({
    query: { limit: '200' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateQuery(schema)(req, res, mock.next);

  const error = mock.getError();
  if (error && error.status === 400 && error.message.includes('limit')) {
    console.log('✅ Test 6: validateQuery error - passed');
    console.log('   Error message:', error.message);
  } else {
    console.log('❌ Test 6: validateQuery error - failed');
    console.log('   Expected 400 error with limit path');
  }
}

// Test 7: validate with multiple schemas - success
{
  const schemas = {
    params: z.object({ id: z.string() }),
    body: z.object({ name: z.string() }),
    query: z.object({ include: z.string().optional() }),
  };

  const req = createMockReq({
    params: { id: '123' },
    body: { name: 'Test' },
    query: { include: 'details' },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validate(schemas)(req, res, mock.next);

  const error = mock.getError();
  if (!error) {
    console.log('✅ Test 7: validate with multiple schemas - passed');
  } else {
    console.log('❌ Test 7: validate with multiple schemas - failed');
    console.log('   Error:', error);
  }
}

// Test 8: validate with nested object error
{
  const schema = z.object({
    user: z.object({
      profile: z.object({
        age: z.number().min(18),
      }),
    }),
  });

  const req = createMockReq({
    body: { user: { profile: { age: 16 } } },
  });
  const res = createMockRes();
  const mock = createMockNext();

  validateBody(schema)(req, res, mock.next);

  const error = mock.getError();
  if (error && error.status === 400 && error.message.includes('user.profile.age')) {
    console.log('✅ Test 8: validate nested object error - passed');
    console.log('   Error message:', error.message);
  } else {
    console.log('❌ Test 8: validate nested object error - failed');
    console.log('   Expected 400 error with nested path user.profile.age');
    if (error) console.log('   Got:', error.message);
  }
}

console.log('\n✨ Validation middleware tests complete!');
