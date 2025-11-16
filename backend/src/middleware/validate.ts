import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import createHttpError from 'http-errors';

/**
 * Validation target types
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation schemas for different request parts
 */
interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Format Zod error into human-readable message
 * Returns the first error with path and issue
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues;
  const firstError = issues[0];
  if (!firstError) {
    return 'Validation failed';
  }

  const path = firstError.path.length > 0 ? firstError.path.join('.') : 'root';
  const message = firstError.message;
  
  return `Validation failed at '${path}': ${message}`;
}

/**
 * Core validation middleware
 * Validates req.body, req.query, and/or req.params based on provided schemas
 * 
 * @param schemas - Object containing optional schemas for body, query, and params
 * @returns Express middleware function
 * 
 * @example
 * ```ts
 * const schemas = {
 *   body: z.object({ name: z.string() }),
 *   params: z.object({ id: z.string() })
 * };
 * router.post('/:id', validate(schemas), handler);
 * ```
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query if schema provided
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }

      // Validate params if schema provided
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = formatZodError(error);
        next(createHttpError(400, message));
      } else {
        next(createHttpError(500, 'Internal validation error'));
      }
    }
  };
}

/**
 * Convenience middleware for validating only req.body
 * 
 * @param schema - Zod schema for request body
 * @returns Express middleware function
 * 
 * @example
 * ```ts
 * const bodySchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 * router.post('/signup', validateBody(bodySchema), handler);
 * ```
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Convenience middleware for validating only req.params
 * 
 * @param schema - Zod schema for route parameters
 * @returns Express middleware function
 * 
 * @example
 * ```ts
 * const paramsSchema = z.object({
 *   id: z.string().uuid()
 * });
 * router.get('/users/:id', validateParams(paramsSchema), handler);
 * ```
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}

/**
 * Convenience middleware for validating only req.query
 * 
 * @param schema - Zod schema for query parameters
 * @returns Express middleware function
 * 
 * @example
 * ```ts
 * const querySchema = z.object({
 *   page: z.coerce.number().positive().optional(),
 *   limit: z.coerce.number().max(100).optional()
 * });
 * router.get('/posts', validateQuery(querySchema), handler);
 * ```
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}
