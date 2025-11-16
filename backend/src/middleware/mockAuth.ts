/**
 * Mock Authentication Middleware
 * 
 * Lightweight auth for development - reads x-player-id header
 * TODO: Replace with JWT-based authentication in production
 * 
 * Usage:
 * - Add x-player-id header to requests
 * - If missing, defaults to "dev-player"
 * - Access via req.playerId in route handlers
 */

import { Request, Response, NextFunction } from 'express';

/**
 * TypeScript declaration merge to add playerId to Request
 */
declare global {
  namespace Express {
    interface Request {
      /** Player identifier from x-player-id header or default "dev-player" */
      playerId: string;
    }
  }
}

/**
 * Mock authentication middleware
 * Extracts player ID from x-player-id header or uses default
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next middleware function
 */
export function mockAuth(req: Request, res: Response, next: NextFunction): void {
  // Read x-player-id header (case-insensitive)
  const headerPlayerId = req.get('x-player-id');
  
  // Set playerId: use header value or default to "dev-player"
  req.playerId = headerPlayerId || 'dev-player';
  
  next();
}
