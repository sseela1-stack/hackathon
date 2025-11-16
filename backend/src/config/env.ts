import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

/**
 * Zod schema for environment variables validation
 * Ensures all required configuration is present and properly typed
 */
const envSchema = z.object({
  /**
   * Server port number
   * @default 3000
   */
  PORT: z.coerce.number().int().positive().default(3000),

  /**
   * Node environment
   * Must be one of: development, test, or production
   */
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /**
   * Database connection URL
   * SQLite: file:./dev.db
   * PostgreSQL: postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
   */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /**
   * Capital One Nessie API key
   * Required for financial data operations
   */
  NESSIE_API_KEY: z.string().min(1, 'NESSIE_API_KEY is required'),

  /**
   * AI/LLM provider API key (e.g., OpenAI, Anthropic)
   * Required for AI agent functionality
   */
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),

  /**
   * Frontend application URL
   * Used for CORS configuration
   */
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),

  /**
   * Optional: Nessie API base URL
   * @default http://api.nessieisreal.com
   */
  NESSIE_BASE_URL: z.string().url().optional().default('http://api.nessieisreal.com'),

  /**
   * Optional: AI model to use
   * @default gpt-4
   */
  AI_MODEL: z.string().optional().default('gpt-4'),
});

/**
 * Validates and parses environment variables
 * @throws {Error} If validation fails with descriptive error messages
 * @returns Parsed and validated environment configuration
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      const errorMessage = [
        '❌ Environment validation failed!',
        '',
        'Missing or invalid environment variables:',
        ...missingVars,
        '',
        '💡 Make sure you have a .env file with all required variables.',
        '   See .env.example for reference.',
      ].join('\n');

      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Validated environment configuration
 * All values are type-safe and guaranteed to exist
 */
const validatedEnv = validateEnv();

/**
 * Typed environment configuration object
 * Provides structured access to all environment variables
 */
export const env = {
  /**
   * Server port number
   */
  port: validatedEnv.PORT,

  /**
   * Node environment (development, test, or production)
   */
  nodeEnv: validatedEnv.NODE_ENV,

  /**
   * Database connection URL
   */
  databaseUrl: validatedEnv.DATABASE_URL,

  /**
   * Frontend application URL for CORS
   */
  frontendUrl: validatedEnv.FRONTEND_URL,

  /**
   * Nessie API configuration
   */
  nessie: {
    /**
     * Nessie API key
     */
    apiKey: validatedEnv.NESSIE_API_KEY,
    /**
     * Nessie API base URL
     */
    baseUrl: validatedEnv.NESSIE_BASE_URL,
  },

  /**
   * AI/LLM provider configuration
   */
  ai: {
    /**
     * AI provider API key
     */
    apiKey: validatedEnv.AI_API_KEY,
    /**
     * AI model identifier
     */
    model: validatedEnv.AI_MODEL,
  },
} as const;

/**
 * Environment boolean flags for convenience
 */

/**
 * True if running in development environment
 */
export const isDev = env.nodeEnv === 'development';

/**
 * True if running in production environment
 */
export const isProd = env.nodeEnv === 'production';

/**
 * True if running in test environment
 */
export const isTest = env.nodeEnv === 'test';

/**
 * Legacy config export for backward compatibility
 * @deprecated Use `env` instead
 */
export const config = env;
