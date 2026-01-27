export type GameMode = 'simple' | 'canvas' | 'upload';

export type RoundStatus = 'describing' | 'uploading' | 'revealing' | 'voting' | 'completed';

export type GameStatus = 'lobby' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  lastSeen: number;
}

export interface Submission {
  playerId: string;
  imageData: string; // base64
  score?: number;
  alignmentInfo?: {
    rotation: number;
    scale: number;
    translateX: number;
    translateY: number;
  };
}

export interface Round {
  roundNumber: number;
  speakerId: string;
  imageId: string;
  submissions: Submission[];
  votes: Record<string, string>; // voterId -> voteeId
  revealedCount: number;
  status: RoundStatus;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

export interface GameConfig {
  totalRounds: number | 'all';
  gameMode: GameMode;
  scoringEnabled: boolean;
  votingEnabled: boolean;
  difficulty: Difficulty;
}

export interface GameState {
  gameCode: string;
  hostId: string;
  config: GameConfig;
  players: Player[];
  currentRound: number;
  speakerOrder: string[];
  rounds: Round[];
  status: GameStatus;
  lastUpdated: number;
}

export interface DrawingImage {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  svg: string;
}
