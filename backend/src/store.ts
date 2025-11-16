/**
 * In-memory game state repository
 * Temporary storage until database integration
 */

import { GameState } from './models/GameState';

/**
 * Simple in-memory store for game states
 * Key: player ID
 * Value: current GameState
 */
const gameStateStore = new Map<string, GameState>();

/**
 * Get game state for a player
 */
export function getGameState(playerId: string): GameState | undefined {
  return gameStateStore.get(playerId);
}

/**
 * Save game state for a player
 */
export function saveGameState(playerId: string, state: GameState): void {
  gameStateStore.set(playerId, state);
}

/**
 * Delete game state for a player
 */
export function deleteGameState(playerId: string): boolean {
  return gameStateStore.delete(playerId);
}

/**
 * Check if player has a game state
 */
export function hasGameState(playerId: string): boolean {
  return gameStateStore.has(playerId);
}

/**
 * Get all player IDs
 */
export function getAllPlayerIds(): string[] {
  return Array.from(gameStateStore.keys());
}

/**
 * Clear all game states (for testing)
 */
export function clearAllGameStates(): void {
  gameStateStore.clear();
}

/**
 * Get store statistics
 */
export function getStoreStats() {
  return {
    totalPlayers: gameStateStore.size,
    playerIds: getAllPlayerIds(),
  };
}
