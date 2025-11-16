/**
 * Investing Controller
 * Handles investment simulation and portfolio management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { simulateYear, rebalance } from '../services/gameLogic';
import { PortfolioMix } from '../models/GameState';
import createHttpError from 'http-errors';

/**
 * Predefined portfolio profiles
 */
const PORTFOLIO_PROFILES: Record<string, PortfolioMix> = {
  conservative: {
    stocks: 0.3, // 30% stocks
    bonds: 0.6, // 60% bonds
    cash: 0.1,  // 10% cash
  },
  balanced: {
    stocks: 0.6, // 60% stocks
    bonds: 0.3, // 30% bonds
    cash: 0.1,  // 10% cash
  },
  aggressive: {
    stocks: 0.8, // 80% stocks
    bonds: 0.15, // 15% bonds
    cash: 0.05, // 5% cash
  },
};

/**
 * Zod schema for simulate query parameters
 */
const simulateQuerySchema = z.object({
  profile: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
  start: z.coerce.number().positive().default(1000),
  market: z.enum(['bull', 'bear', 'sideways']).optional().default('sideways'),
});

/**
 * Zod schema for rebalance request body
 */
const rebalanceBodySchema = z.object({
  path: z.array(z.number().nonnegative()).min(1, 'Path must contain at least one value'),
  targetMix: z.object({
    stocks: z.number().min(0).max(1),
    bonds: z.number().min(0).max(1),
    cash: z.number().min(0).max(1),
  }).refine(
    (mix) => {
      const sum = mix.stocks + mix.bonds + mix.cash;
      return Math.abs(sum - 1.0) < 0.01; // Allow small rounding errors
    },
    { message: 'Portfolio mix percentages must sum to 1.0' }
  ),
});

/**
 * GET /api/investing/simulate
 * Simulates a 12-month investment portfolio performance
 * 
 * Query params:
 * - profile: conservative | balanced | aggressive (default: balanced)
 * - start: number (starting portfolio value, default: 1000)
 * - market: bull | bear | sideways (default: sideways)
 * 
 * Returns:
 * - endValue: final portfolio value after 12 months
 * - monthlyPath: array of 13 values (month 0-12)
 * - totalReturn: absolute gain/loss
 * - totalReturnPercent: percentage gain/loss
 * - mix: portfolio allocation used
 * - profile: profile name used
 */
export async function getSimulate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate query parameters
    const validation = simulateQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid query parameters', {
        details: validation.error.issues,
      });
    }

    const { profile, start, market } = validation.data;

    // Get portfolio mix for profile
    const mix = PORTFOLIO_PROFILES[profile];

    // Run simulation
    const result = simulateYear(mix, start, market);

    res.json({
      success: true,
      simulation: {
        ...result,
        mix,
        profile,
        startValue: start,
        market,
      },
    });
  } catch (error) {
    console.error('Error in getSimulate:', error);
    next(error);
  }
}

/**
 * POST /api/investing/rebalance
 * Analyzes a portfolio path and provides rebalancing recommendations
 * 
 * Body:
 * - path: number[] - historical portfolio values
 * - targetMix: PortfolioMix - desired allocation
 * 
 * Returns:
 * - rebalanceNeeded: boolean
 * - recommendations: string[] - actionable advice
 * - currentPath: the input path
 * - targetMix: the target allocation
 * - analysis: summary statistics
 */
export async function postRebalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const validation = rebalanceBodySchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid request body', {
        details: validation.error.issues,
      });
    }

    const { path, targetMix } = validation.data;

    // Calculate some basic statistics
    const startValue = path[0];
    const endValue = path[path.length - 1];
    const totalReturn = endValue - startValue;
    const totalReturnPercent = (totalReturn / startValue) * 100;

    // Find max and min values for volatility indication
    const maxValue = Math.max(...path);
    const minValue = Math.min(...path);
    const volatilityRange = maxValue - minValue;
    const volatilityPercent = (volatilityRange / startValue) * 100;

    // Get rebalancing recommendations (stub for now)
    const rebalanceResult = rebalance(path, targetMix);

    // Enhanced recommendations based on analysis
    const enhancedRecommendations = [
      ...rebalanceResult.recommendations,
      `Portfolio grew from $${startValue.toFixed(2)} to $${endValue.toFixed(2)} (${totalReturnPercent.toFixed(2)}%)`,
      volatilityPercent > 20
        ? `High volatility detected (${volatilityPercent.toFixed(1)}% range). Consider rebalancing to reduce risk.`
        : `Volatility within acceptable range (${volatilityPercent.toFixed(1)}%).`,
    ];

    res.json({
      success: true,
      rebalance: {
        rebalanceNeeded: rebalanceResult.rebalanceNeeded || volatilityPercent > 20,
        recommendations: enhancedRecommendations,
        currentPath: path,
        targetMix,
        analysis: {
          startValue,
          endValue,
          totalReturn: Math.round(totalReturn * 100) / 100,
          totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
          maxValue: Math.round(maxValue * 100) / 100,
          minValue: Math.round(minValue * 100) / 100,
          volatilityRange: Math.round(volatilityRange * 100) / 100,
          volatilityPercent: Math.round(volatilityPercent * 100) / 100,
          pathLength: path.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in postRebalance:', error);
    next(error);
  }
}
