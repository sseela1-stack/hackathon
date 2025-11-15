import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { pino } from 'pino';
import { env, isProd } from './config/env';
import gameRoutes from './routes/gameRoutes';
import agentRoutes from './routes/agentRoutes';
import healthRoutes from './routes/healthRoutes';
import { Server } from 'http';

/**
 * Pino logger instance
 * Configured based on environment
 */
const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
});

/**
 * HTTP request logger middleware
 * Attaches unique request ID to each request
 */
const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingId = req.id ?? req.headers['x-request-id'];
    if (existingId) return existingId as string;
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
});

/**
 * Express application instance
 */
const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,
}));

/**
 * CORS Configuration
 * Allows credentials and restricts origin to frontend URL
 */
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/**
 * Compression Middleware
 */
app.use(compression());

/**
 * Request Logging Middleware
 * Attaches req.id to each request
 */
app.use(httpLogger);

/**
 * Health Check Route
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    uptime: process.uptime(),
  });
});

/**
 * API Routes
 */
app.use('/api/game', gameRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/health', healthRoutes);

/**
 * Root Endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'FinQuest API',
    version: '1.0.0',
    environment: env.nodeEnv,
    endpoints: {
      health: '/api/health',
      game: '/api/game',
      agents: '/api/agent',
    },
  });
});

/**
 * 404 Handler
 * Returns JSON error for unmatched routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      code: 'NOT_FOUND',
      path: req.path,
    },
  });
});

/**
 * Error Response Interface
 */
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    stack?: string;
  };
}

/**
 * Centralized Error Handler
 * Returns standardized error response
 * Hides stack traces in production
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with request context
  logger.error({
    err,
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
    },
  }, 'Request error');

  // Determine status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: (err as any).code || 'INTERNAL_SERVER_ERROR',
    },
  };

  // Include stack trace only in non-production environments
  if (!isProd) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

/**
 * Server instance
 */
let server: Server | null = null;

/**
 * Graceful Shutdown Handler
 * Closes server and cleans up resources
 */
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forceful shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

/**
 * Process Signal Handlers
 */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * Unhandled Rejection Handler
 */
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error({ err: reason, promise }, 'Unhandled Rejection');
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (err: Error) => {
  logger.error({ err }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

/**
 * Start Server
 */
server = app.listen(env.port, () => {
  logger.info({
    port: env.port,
    nodeEnv: env.nodeEnv,
    frontendUrl: env.frontendUrl,
  }, '🚀 FinQuest Backend server started');
  
  logger.info(`📊 Environment: ${env.nodeEnv}`);
  logger.info(`🌐 CORS enabled for: ${env.frontendUrl}`);
  logger.info(`🔒 Security middleware enabled`);
  logger.info(`📝 Request logging active`);
});

export default app;
