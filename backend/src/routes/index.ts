import { Express } from 'express';
import gameRoutes from './gameRoutes';
import agentRoutes from './agentRoutes';
import healthRoutes from './healthRoutes';
import investingRoutes from './investingRoutes';

/**
 * Register all routes with the Express app
 * 
 * Mounts:
 * - /api/game - Game state management routes
 * - /api/agent - AI agent interaction routes
 * - /api/health - Health check route
 * - /api/investing - Investment simulation and portfolio management routes
 */
export function registerRoutes(app: Express): void {
  app.use('/api/game', gameRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/investing', investingRoutes);
}
