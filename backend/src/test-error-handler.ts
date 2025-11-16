/**
 * Minimal tests for error handler middleware
 * 
 * Run: npm run test:errors
 */

import { errorHandler } from './middleware/errorHandler';
import { ZodError, z } from 'zod';
import createHttpError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

// Mock Express request/response/next
function createMockReq(): Request {
  return {} as Request;
}

function createMockRes(): {
  res: Response;
  getStatus: () => number;
  getJson: () => any;
} {
  let statusCode = 200;
  let jsonData: any = null;

  const res = {
    headersSent: false,
    status: function (code: number) {
      statusCode = code;
      return this;
    },
    json: function (data: any) {
      jsonData = data;
      return this;
    },
  } as Response;

  return {
    res,
    getStatus: () => statusCode,
    getJson: () => jsonData,
  };
}

function createMockNext(): NextFunction {
  return (err?: any) => {
    if (err) console.log('Next called with error:', err);
  };
}

console.log('🧪 Testing error handler middleware...\n');

// Test 1: ZodError -> 400 with formatted message
{
  const schema = z.object({ email: z.string().email() });
  let zodError: ZodError | null = null;
  
  try {
    schema.parse({ email: 'invalid' });
  } catch (err) {
    zodError = err as ZodError;
  }

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(zodError!, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 400 &&
    json?.error?.message.includes('email') &&
    json?.error?.code === 'VALIDATION_ERROR'
  ) {
    console.log('✅ Test 1: ZodError -> 400 - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('❌ Test 1: ZodError -> 400 - failed');
    console.log('   Expected: 400 with VALIDATION_ERROR');
    console.log('   Got status:', status, 'json:', json);
  }
}

console.log();

// Test 2: HttpError 404 -> uses status
{
  const httpError = createHttpError(404, 'Resource not found');

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(httpError, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 404 &&
    json?.error?.message === 'Resource not found' &&
    json?.error?.code === 'NotFoundError'
  ) {
    console.log('✅ Test 2: HttpError 404 - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('❌ Test 2: HttpError 404 - failed');
    console.log('   Expected: 404 with NotFoundError');
    console.log('   Got status:', status, 'json:', json);
  }
}

console.log();

// Test 3: HttpError 401 (Unauthorized)
{
  const httpError = createHttpError(401, 'Authentication required');

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(httpError, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 401 &&
    json?.error?.message === 'Authentication required' &&
    json?.error?.code === 'UnauthorizedError'
  ) {
    console.log('✅ Test 3: HttpError 401 - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('❌ Test 3: HttpError 401 - failed');
    console.log('   Got status:', status, 'json:', json);
  }
}

console.log();

// Test 4: Generic Error -> 500 (development mode)
{
  process.env.NODE_ENV = 'development';
  const genericError = new Error('Database connection failed');

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(genericError, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 500 &&
    json?.error?.message === 'Database connection failed' &&
    json?.error?.code === 'INTERNAL_ERROR'
  ) {
    console.log('✅ Test 4: Generic Error (dev mode) - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('❌ Test 4: Generic Error (dev mode) - failed');
    console.log('   Expected: 500 with actual error message');
    console.log('   Got status:', status, 'json:', json);
  }
}

console.log();

// Test 5: Generic Error -> 500 (production mode - hides details)
{
  process.env.NODE_ENV = 'production';
  const genericError = new Error('Sensitive internal error');

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(genericError, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 500 &&
    json?.error?.message === 'Internal server error' &&
    json?.error?.code === 'INTERNAL_ERROR'
  ) {
    console.log('✅ Test 5: Generic Error (prod mode) - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
    console.log('   (Correctly hides internal details in production)');
  } else {
    console.log('❌ Test 5: Generic Error (prod mode) - failed');
    console.log('   Expected: 500 with generic message');
    console.log('   Got status:', status, 'json:', json);
  }
}

console.log();

// Test 6: Nested Zod validation error (nested path)
{
  const schema = z.object({
    user: z.object({
      profile: z.object({
        age: z.number().min(18),
      }),
    }),
  });
  
  let zodError: ZodError | null = null;
  
  try {
    schema.parse({ user: { profile: { age: 16 } } });
  } catch (err) {
    zodError = err as ZodError;
  }

  const req = createMockReq();
  const mock = createMockRes();
  const next = createMockNext();

  errorHandler(zodError!, req, mock.res, next);

  const status = mock.getStatus();
  const json = mock.getJson();

  if (
    status === 400 &&
    json?.error?.message.includes('user.profile.age') &&
    json?.error?.code === 'VALIDATION_ERROR'
  ) {
    console.log('✅ Test 6: Nested Zod error - passed');
    console.log('   Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('❌ Test 6: Nested Zod error - failed');
    console.log('   Got status:', status, 'json:', json);
  }
}

// Reset NODE_ENV
delete process.env.NODE_ENV;

console.log('\n✨ Error handler tests complete!');
