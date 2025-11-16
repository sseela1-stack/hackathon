import { Express } from 'express';
import gameRoutes from './gameRoutes';
import agentRoutes from './agentRoutes';
import healthRoutes from './healthRoutes';

/**
 * Register all routes with the Express app
 * 
 * Mounts:
 * - /api/game - Game state management routes
 * - /api/agent - AI agent interaction routes
 * - /api/health - Health check route
 */
export function registerRoutes(app: Express): void {
  app.use('/api/game', gameRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/health', healthRoutes);
}
