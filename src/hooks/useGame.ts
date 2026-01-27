import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, GameConfig, Submission, Round } from '../types';
import { getPlayerSession, savePlayerSession, clearPlayerSession } from '../utils/storage';
import { saveGameStateFirebase, getGameStateFirebase, subscribeToGame } from '../utils/firebase';
import { generateGameCode, generatePlayerId, shuffleArray } from '../utils/gameCode';
import { getRandomDrawing } from '../data/drawings';

export const useGame = (initialGameCode?: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Subscribe to game updates
  useEffect(() => {
    if (!initialGameCode) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToGame(initialGameCode, (state) => {
      // Get session on each callback to ensure we have the latest
      const session = getPlayerSession();

      if (state) {
        // Always update the state from Firebase
        lastUpdateRef.current = state.lastUpdated;
        setGameState(state);

        // Update current player reference
        if (session && session.gameCode === initialGameCode) {
          const player = state.players.find(p => p.id === session.playerId);
          if (player) {
            setCurrentPlayer(player);
          }
        }
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [initialGameCode]);

  // Update game state and persist to Firebase
  const updateGameState = useCallback(async (updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      if (!prev) return prev;
      const updated = updater({
        ...prev,
        lastUpdated: Date.now(),
      });
      // Save to Firebase (async, but we don't wait)
      saveGameStateFirebase(updated).catch(console.error);
      lastUpdateRef.current = updated.lastUpdated;
      return updated;
    });
  }, []);

  // Create a new game
  const createGame = useCallback(async (hostName: string, config: GameConfig): Promise<string> => {
    const gameCode = generateGameCode();
    const hostId = generatePlayerId();

    const newState: GameState = {
      gameCode,
      hostId,
      config,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        lastSeen: Date.now(),
      }],
      currentRound: 0,
      speakerOrder: [],
      rounds: [],
      status: 'lobby',
      lastUpdated: Date.now(),
    };

    await saveGameStateFirebase(newState);
    savePlayerSession({ playerId: hostId, playerName: hostName, gameCode });
    setGameState(newState);
    setCurrentPlayer(newState.players[0]);
    lastUpdateRef.current = newState.lastUpdated;

    return gameCode;
  }, []);

  // Join an existing game
  const joinGame = useCallback(async (gameCode: string, playerName: string): Promise<boolean> => {
    const normalizedCode = gameCode.toUpperCase();
    const state = await getGameStateFirebase(normalizedCode);

    if (!state) {
      setError('Game not found');
      return false;
    }

    if (state.status !== 'lobby') {
      setError('Game already in progress');
      return false;
    }

    // Check if name already taken
    if (state.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      setError('Name already taken');
      return false;
    }

    const playerId = generatePlayerId();
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      lastSeen: Date.now(),
    };

    const updatedState: GameState = {
      ...state,
      players: [...state.players, newPlayer],
      lastUpdated: Date.now(),
    };

    await saveGameStateFirebase(updatedState);
    savePlayerSession({ playerId, playerName, gameCode: normalizedCode });
    setGameState(updatedState);
    setCurrentPlayer(newPlayer);
    lastUpdateRef.current = updatedState.lastUpdated;
    setError(null);

    return true;
  }, []);

  // Rejoin an existing game
  const rejoinGame = useCallback(async (gameCode: string, playerId: string): Promise<boolean> => {
    const state = await getGameStateFirebase(gameCode);
    if (!state) {
      setError('Game not found');
      return false;
    }

    const player = state.players.find(p => p.id === playerId);
    if (!player) {
      setError('Player not found in game');
      return false;
    }

    // Update lastSeen
    const updatedState: GameState = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId ? { ...p, lastSeen: Date.now() } : p
      ),
      lastUpdated: Date.now(),
    };

    await saveGameStateFirebase(updatedState);
    setGameState(updatedState);
    setCurrentPlayer(player);
    lastUpdateRef.current = updatedState.lastUpdated;
    setError(null);

    return true;
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    if (!gameState || !currentPlayer?.isHost) return;

    const playerIds = gameState.players.map(p => p.id);
    const speakerOrder = shuffleArray(playerIds);
    const totalRounds = gameState.config.totalRounds === 'all'
      ? playerIds.length
      : Math.min(gameState.config.totalRounds, playerIds.length);

    // Create first round
    const usedImages: string[] = [];
    const firstImage = getRandomDrawing(usedImages);
    if (!firstImage) return;

    const firstRound: Round = {
      roundNumber: 1,
      speakerId: speakerOrder[0],
      imageId: firstImage.id,
      submissions: [],
      votes: {},
      revealedCount: 0,
      status: 'describing',
    };

    updateGameState(prev => ({
      ...prev,
      status: 'playing',
      speakerOrder: speakerOrder.slice(0, totalRounds),
      currentRound: 1,
      rounds: [firstRound],
    }));
  }, [gameState, currentPlayer, updateGameState]);

  // Submit a drawing
  const submitDrawing = useCallback((imageData: string) => {
    if (!gameState || !currentPlayer) return;

    const currentRoundData = gameState.rounds[gameState.currentRound - 1];
    if (!currentRoundData) return;

    // Can't submit if you're the speaker
    if (currentRoundData.speakerId === currentPlayer.id) return;

    // Check if already submitted
    if (currentRoundData.submissions.some(s => s.playerId === currentPlayer.id)) return;

    const submission: Submission = {
      playerId: currentPlayer.id,
      imageData,
    };

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? { ...r, submissions: [...r.submissions, submission] }
          : r
      ),
    }));
  }, [gameState, currentPlayer, updateGameState]);

  // Update submission with score
  const updateSubmissionScore = useCallback((playerId: string, score: number, alignmentInfo: Submission['alignmentInfo']) => {
    if (!gameState) return;

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? {
            ...r,
            submissions: r.submissions.map(s =>
              s.playerId === playerId
                ? { ...s, score, alignmentInfo }
                : s
            ),
          }
          : r
      ),
    }));
  }, [gameState, updateGameState]);

  // Start reveal phase
  const startReveal = useCallback(() => {
    if (!gameState || !currentPlayer) return;

    const currentRoundData = gameState.rounds[gameState.currentRound - 1];
    if (!currentRoundData) return;

    // Only speaker or host can start reveal
    if (currentRoundData.speakerId !== currentPlayer.id && !currentPlayer.isHost) return;

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? { ...r, status: 'revealing' }
          : r
      ),
    }));
  }, [gameState, currentPlayer, updateGameState]);

  // Reveal next drawing
  const revealNext = useCallback(() => {
    if (!gameState) return;

    const currentRoundData = gameState.rounds[gameState.currentRound - 1];
    if (!currentRoundData) return;

    const newCount = currentRoundData.revealedCount + 1;
    const allRevealed = newCount >= currentRoundData.submissions.length;

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? {
            ...r,
            revealedCount: newCount,
            status: allRevealed
              ? (prev.config.votingEnabled ? 'voting' : 'completed')
              : 'revealing',
          }
          : r
      ),
    }));
  }, [gameState, updateGameState]);

  // Cast a vote
  const castVote = useCallback((voteeId: string) => {
    if (!gameState || !currentPlayer) return;

    // Can't vote for yourself
    if (voteeId === currentPlayer.id) return;

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? { ...r, votes: { ...r.votes, [currentPlayer.id]: voteeId } }
          : r
      ),
    }));
  }, [gameState, currentPlayer, updateGameState]);

  // End voting and complete round
  const endVoting = useCallback(() => {
    if (!gameState) return;

    updateGameState(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) =>
        i === prev.currentRound - 1
          ? { ...r, status: 'completed' }
          : r
      ),
    }));
  }, [gameState, updateGameState]);

  // Start next round
  const nextRound = useCallback(() => {
    if (!gameState) return;

    const nextRoundNumber = gameState.currentRound + 1;

    // Check if game is over
    if (nextRoundNumber > gameState.speakerOrder.length) {
      updateGameState(prev => ({
        ...prev,
        status: 'finished',
      }));
      return;
    }

    // Get used images
    const usedImages = gameState.rounds.map(r => r.imageId);
    const nextImage = getRandomDrawing(usedImages);

    if (!nextImage) {
      updateGameState(prev => ({
        ...prev,
        status: 'finished',
      }));
      return;
    }

    const newRound: Round = {
      roundNumber: nextRoundNumber,
      speakerId: gameState.speakerOrder[nextRoundNumber - 1],
      imageId: nextImage.id,
      submissions: [],
      votes: {},
      revealedCount: 0,
      status: 'describing',
    };

    updateGameState(prev => ({
      ...prev,
      currentRound: nextRoundNumber,
      rounds: [...prev.rounds, newRound],
    }));
  }, [gameState, updateGameState]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    clearPlayerSession();
    setGameState(null);
    setCurrentPlayer(null);
  }, []);

  // Reset to lobby (for play again)
  const resetToLobby = useCallback(() => {
    if (!gameState || !currentPlayer?.isHost) return;

    updateGameState(prev => ({
      ...prev,
      status: 'lobby',
      currentRound: 0,
      speakerOrder: [],
      rounds: [],
    }));
  }, [gameState, currentPlayer, updateGameState]);

  return {
    gameState,
    currentPlayer,
    loading,
    error,
    createGame,
    joinGame,
    rejoinGame,
    startGame,
    submitDrawing,
    updateSubmissionScore,
    startReveal,
    revealNext,
    castVote,
    endVoting,
    nextRound,
    leaveGame,
    resetToLobby,
    isHost: currentPlayer?.isHost ?? false,
    isSpeaker: gameState?.rounds[gameState.currentRound - 1]?.speakerId === currentPlayer?.id,
  };
};
