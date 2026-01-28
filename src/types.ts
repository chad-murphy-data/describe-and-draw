export type GameMode = 'simple' | 'canvas';

export type RoundStatus = 'describing' | 'revealing' | 'voting' | 'completed';

// 'voting' = end-of-game category voting phase (paper mode)
// 'ceremony' = awards ceremony display phase
export type GameStatus = 'lobby' | 'playing' | 'voting' | 'ceremony' | 'finished';

// Voting style based on group size
// 'none' = no scoring/voting (recommended for 2-3 players)
// 'top2' = pick top 2 (recommended for 4-5 players)
// 'top3' = pick top 3 (recommended for 6+ players)
// 'categories' = category-based voting for paper mode (4+ players)
export type VotingStyle = 'none' | 'top2' | 'top3' | 'categories';

// Award categories for paper mode voting
export type AwardCategory =
  | 'michelangelo'    // 🎨 Best Drawing
  | 'happyAccident'   // 😂 Funniest
  | 'scenicRoute'     // 🛤️ Most Creative
  | 'translator'      // 🗣️ Best Communicator
  | 'blamePrompt';    // 🎯 Hardest Round

export interface AwardInfo {
  id: AwardCategory;
  emoji: string;
  name: string;
  description: string;
  votesFor: 'player' | 'round';
}

// Category votes: voterId -> { categoryId -> playerId or roundNumber }
export type CategoryVotes = Record<AwardCategory, string>;

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

// Ranked vote: player's top picks in order (1st, 2nd, 3rd)
export type RankedVote = string[]; // Array of playerIds in preference order

export interface Round {
  roundNumber: number;
  speakerId: string;
  imageId: string;
  submissions: Submission[];
  votes: Record<string, string>; // voterId -> voteeId (legacy single vote)
  rankedVotes: Record<string, RankedVote>; // voterId -> [1st, 2nd, 3rd] picks
  revealedCount: number;
  status: RoundStatus;
}

// End-of-game category votes (paper mode)
export type EndGameVotes = Record<string, CategoryVotes>; // voterId -> category votes

export type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

export interface GameConfig {
  totalRounds: number | 'all';
  gameMode: GameMode;
  scoringEnabled: boolean;
  votingEnabled: boolean;
  votingStyle: VotingStyle; // 'none', 'top2', 'top3'
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
  // End-of-game category votes (paper mode)
  categoryVotes?: EndGameVotes;
}

export interface DrawingImage {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  svg: string;
}
