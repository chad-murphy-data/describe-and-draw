import { GameState } from '../types';

const STORAGE_PREFIX = 'blinddraw_';
const GAMES_KEY = `${STORAGE_PREFIX}games`;
const PLAYER_KEY = `${STORAGE_PREFIX}player`;

// Get all game codes
export const getGameCodes = (): string[] => {
  const data = localStorage.getItem(GAMES_KEY);
  return data ? JSON.parse(data) : [];
};

// Save game state
export const saveGameState = (state: GameState): void => {
  const key = `${STORAGE_PREFIX}game_${state.gameCode}`;
  localStorage.setItem(key, JSON.stringify(state));

  // Track game codes
  const codes = getGameCodes();
  if (!codes.includes(state.gameCode)) {
    codes.push(state.gameCode);
    localStorage.setItem(GAMES_KEY, JSON.stringify(codes));
  }
};

// Get game state
export const getGameState = (gameCode: string): GameState | null => {
  const key = `${STORAGE_PREFIX}game_${gameCode}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Delete game state
export const deleteGameState = (gameCode: string): void => {
  const key = `${STORAGE_PREFIX}game_${gameCode}`;
  localStorage.removeItem(key);

  const codes = getGameCodes();
  const filtered = codes.filter(c => c !== gameCode);
  localStorage.setItem(GAMES_KEY, JSON.stringify(filtered));
};

// Player session management
export interface PlayerSession {
  playerId: string;
  playerName: string;
  gameCode: string;
}

export const savePlayerSession = (session: PlayerSession): void => {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(session));
};

export const getPlayerSession = (): PlayerSession | null => {
  const data = localStorage.getItem(PLAYER_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearPlayerSession = (): void => {
  localStorage.removeItem(PLAYER_KEY);
};

// Clean up old games (older than 24 hours)
export const cleanupOldGames = (): void => {
  const codes = getGameCodes();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  codes.forEach(code => {
    const state = getGameState(code);
    if (state && now - state.lastUpdated > maxAge) {
      deleteGameState(code);
    }
  });
};
