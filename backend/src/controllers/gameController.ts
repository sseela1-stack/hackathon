import { Request, Response } from 'express';
import { gameLogicService } from '../services/gameLogic';
import { MakeChoiceRequest } from '../models/GameState';

/**
 * Controller for game-related endpoints
 */

// In-memory game state storage (replace with database in production)
const gameStates = new Map();

/**
 * GET /api/game/state
 * Returns the current game state for a user
 */
export const getGameState = (req: Request, res: Response) => {
  try {
    // TODO: Get user ID from authentication/session
    const userId = 'demo-user';
    
    // Check if game state exists
    let gameState = gameStates.get(userId);
    
    // Initialize new game if not exists
    if (!gameState) {
      gameState = gameLogicService.initializeGame(userId, 'Player');
      gameStates.set(userId, gameState);
    }

    res.json({
      success: true,
      data: gameState,
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve game state',
    });
  }
};

/**
 * POST /api/game/choice
 * Process a player's choice and return updated game state
 */
export const postChoice = (req: Request, res: Response) => {
  try {
    // TODO: Get user ID from authentication/session
    const userId = 'demo-user';
    
    const choiceRequest: MakeChoiceRequest = req.body;

    // Validate request
    if (!choiceRequest.eventId || !choiceRequest.choiceId || !choiceRequest.mood) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventId, choiceId, or mood',
      });
    }

    // Get current game state
    const currentState = gameStates.get(userId);
    if (!currentState) {
      return res.status(404).json({
        success: false,
        error: 'Game state not found. Please start a new game.',
      });
    }

    // Process the choice
    const updatedState = gameLogicService.processChoice(currentState, choiceRequest);
    gameStates.set(userId, updatedState);

    res.json({
      success: true,
      data: updatedState,
    });
  } catch (error) {
    console.error('Error processing choice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process choice',
    });
  }
};

/**
 * GET /api/game/playbook
 * Returns the Money Playbook summary for the current session
 */
export const getPlaybook = (req: Request, res: Response) => {
  try {
    // TODO: Get user ID from authentication/session
    const userId = 'demo-user';
    
    const gameState = gameStates.get(userId);
    
    if (!gameState) {
      return res.status(404).json({
        success: false,
        error: 'No game session found',
      });
    }

    const playbook = gameLogicService.generatePlaybookSummary(gameState);

    res.json({
      success: true,
      data: playbook,
    });
  } catch (error) {
    console.error('Error generating playbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate playbook',
    });
  }
};
