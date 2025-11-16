/**
 * Prisma-backed game repository implementation
 * Handles all database operations for game state, events, and players
 */

import { db } from '../config/db';
import { GameState, GameDelta, Role, Mood, Difficulty } from '../models/GameState';
import createHttpError from 'http-errors';

/**
 * Custom error for optimistic concurrency conflicts
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Game repository interface
 * Defines all database operations needed for game management
 */
export interface IGameRepo {
  /**
   * Load game state for a player
   * @param playerId - Player identifier
   * @returns Game state snapshot with version, or null if not found
   */
  loadState(
    playerId: string
  ): Promise<{ snapshot: GameState; version: number } | null>;

  /**
   * Save game state with optimistic concurrency control
   * @param playerId - Player identifier
   * @param next - New game state to save
   * @param expectedVersion - Expected version number for optimistic locking
   * @param health - Computed health score (0-100)
   * @throws {ConflictError} If version mismatch (concurrent update detected)
   */
  saveState(
    playerId: string,
    next: GameState,
    expectedVersion: number,
    health: number
  ): Promise<void>;

  /**
   * Append an event to player's history
   * @param playerId - Player identifier
   * @param event - Event data to append
   */
  appendEvent(
    playerId: string,
    event: {
      scenarioId: string;
      choiceId: string;
      delta: GameDelta;
      healthAfter: number;
      monthIndex: number;
    }
  ): Promise<void>;

  /**
   * Ensure player exists in database
   * Creates new player or updates existing one
   * @param profile - Player profile data
   * @returns Player ID
   */
  ensurePlayer(profile: {
    id?: string;
    role: Role;
    mood: Mood;
    difficulty: Difficulty;
  }): Promise<string>;

  /**
   * Reset player's game state and history
   * @param playerId - Player identifier
   */
  reset(playerId: string): Promise<void>;

  /**
   * Get player's event history
   * @param playerId - Player identifier
   * @param limit - Maximum number of events to return
   * @returns Array of historical events
   */
  getHistory(
    playerId: string,
    limit?: number
  ): Promise<
    Array<{
      scenarioId: string;
      choiceId: string;
      delta: GameDelta;
      healthAfter: number;
      monthIndex: number;
      createdAt: Date;
    }>
  >;
}

/**
 * Prisma implementation of game repository
 */
export class PrismaGameRepo implements IGameRepo {
  /**
   * Load game state for a player
   */
  async loadState(
    playerId: string
  ): Promise<{ snapshot: GameState; version: number } | null> {
    const gameState = await db.gameState.findUnique({
      where: { playerId },
    });

    if (!gameState) {
      return null;
    }

    // Parse JSON state
    let snapshot: GameState;
    try {
      // SQLite stores as string, PostgreSQL as JSONB
      const stateData =
        typeof gameState.stateJson === 'string'
          ? JSON.parse(gameState.stateJson)
          : gameState.stateJson;
      snapshot = stateData as GameState;
    } catch (error) {
      throw new Error(`Failed to parse game state JSON: ${error}`);
    }

    return {
      snapshot,
      version: gameState.version,
    };
  }

  /**
   * Save game state with optimistic concurrency control
   */
  async saveState(
    playerId: string,
    next: GameState,
    expectedVersion: number,
    health: number
  ): Promise<void> {
    try {
      await db.$transaction(async (tx: any) => {
        // Check if game state exists
        const existing = await tx.gameState.findUnique({
          where: { playerId },
          select: { version: true },
        });

        if (existing) {
          // Verify version for optimistic concurrency
          if (existing.version !== expectedVersion) {
            throw new ConflictError(
              `Version conflict: expected ${expectedVersion}, found ${existing.version}`
            );
          }

          // Update existing state
          await tx.gameState.update({
            where: { playerId },
            data: {
              stateJson: JSON.stringify(next),
              health,
              version: expectedVersion + 1,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new state (expectedVersion should be 0 for new records)
          if (expectedVersion !== 0) {
            throw new ConflictError(
              `Cannot create game state with expectedVersion ${expectedVersion} (must be 0)`
            );
          }

          await tx.gameState.create({
            data: {
              playerId,
              stateJson: JSON.stringify(next),
              health,
              version: 1,
            },
          });
        }
      });
    } catch (error) {
      // Re-throw ConflictError as-is
      if (error instanceof ConflictError) {
        throw error;
      }
      // Wrap other errors
      throw new Error(`Failed to save game state: ${error}`);
    }
  }

  /**
   * Append an event to player's history
   */
  async appendEvent(
    playerId: string,
    event: {
      scenarioId: string;
      choiceId: string;
      delta: GameDelta;
      healthAfter: number;
      monthIndex: number;
    }
  ): Promise<void> {
    await db.event.create({
      data: {
        playerId,
        scenarioId: event.scenarioId,
        choiceId: event.choiceId,
        deltaJson: JSON.stringify(event.delta),
        healthAfter: event.healthAfter,
        monthIndex: event.monthIndex,
      },
    });
  }

  /**
   * Ensure player exists in database
   */
  async ensurePlayer(profile: {
    id?: string;
    role: Role;
    mood: Mood;
    difficulty: Difficulty;
  }): Promise<string> {
    if (profile.id) {
      // Update or create player with specific ID
      const player = await db.player.upsert({
        where: { id: profile.id },
        update: {
          role: profile.role,
          mood: profile.mood,
          difficulty: profile.difficulty,
          updatedAt: new Date(),
        },
        create: {
          id: profile.id,
          role: profile.role,
          mood: profile.mood,
          difficulty: profile.difficulty,
        },
      });
      return player.id;
    } else {
      // Create new player with auto-generated ID
      const player = await db.player.create({
        data: {
          role: profile.role,
          mood: profile.mood,
          difficulty: profile.difficulty,
        },
      });
      return player.id;
    }
  }

  /**
   * Reset player's game state and history
   */
  async reset(playerId: string): Promise<void> {
    await db.$transaction([
      // Delete all events
      db.event.deleteMany({
        where: { playerId },
      }),
      // Delete game state
      db.gameState.deleteMany({
        where: { playerId },
      }),
    ]);
  }

  /**
   * Get player's event history
   */
  async getHistory(
    playerId: string,
    limit: number = 100
  ): Promise<
    Array<{
      scenarioId: string;
      choiceId: string;
      delta: GameDelta;
      healthAfter: number;
      monthIndex: number;
      createdAt: Date;
    }>
  > {
    const events = await db.event.findMany({
      where: { playerId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return events.map((event: any) => {
      // Parse JSON delta
      const delta =
        typeof event.deltaJson === 'string'
          ? JSON.parse(event.deltaJson)
          : event.deltaJson;

      return {
        scenarioId: event.scenarioId,
        choiceId: event.choiceId,
        delta: delta as GameDelta,
        healthAfter: event.healthAfter,
        monthIndex: event.monthIndex,
        createdAt: event.createdAt,
      };
    });
  }
}

/**
 * Singleton repository instance
 */
export const gameRepo: IGameRepo = new PrismaGameRepo();
