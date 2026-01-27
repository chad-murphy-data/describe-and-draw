import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { LobbyPage } from './LobbyPage';
import { SpeakerView } from './SpeakerView';
import { DrawerView } from './DrawerView';
import { RevealView } from './RevealView';
import { EndGameView } from './EndGameView';

export const GamePage = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();

  const {
    gameState,
    currentPlayer,
    loading,
    startGame,
    submitDrawing,
    updateSubmissionScore,
    startReveal,
    revealNext,
    castVote,
    castRankedVote,
    endVoting,
    nextRound,
    leaveGame,
    resetToLobby,
    updateConfig,
    isSpeaker,
  } = useGame(gameCode);

  // Redirect if no game or player
  useEffect(() => {
    if (!loading && (!gameState || !currentPlayer)) {
      navigate('/');
    }
  }, [loading, gameState, currentPlayer, navigate]);

  const handleLeave = () => {
    leaveGame();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="pulse" style={{ fontSize: '2rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!gameState || !currentPlayer) {
    return null;
  }

  // Lobby
  if (gameState.status === 'lobby') {
    return (
      <LobbyPage
        gameState={gameState}
        currentPlayer={currentPlayer}
        onStartGame={startGame}
        onLeave={handleLeave}
        onUpdateConfig={updateConfig}
      />
    );
  }

  // Game finished
  if (gameState.status === 'finished') {
    return (
      <EndGameView
        gameState={gameState}
        currentPlayer={currentPlayer}
        onPlayAgain={resetToLobby}
        onLeave={handleLeave}
      />
    );
  }

  // Playing
  const currentRound = gameState.rounds[gameState.currentRound - 1];

  if (!currentRound) {
    return (
      <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="pulse" style={{ fontSize: '2rem' }}>Loading round...</div>
        </div>
      </div>
    );
  }

  // Reveal/Voting phase
  if (currentRound.status === 'revealing' || currentRound.status === 'voting' || currentRound.status === 'completed') {
    return (
      <RevealView
        gameState={gameState}
        currentRound={currentRound}
        currentPlayer={currentPlayer}
        onRevealNext={revealNext}
        onUpdateScore={updateSubmissionScore}
        onCastVote={castVote}
        onCastRankedVote={castRankedVote}
        onEndVoting={endVoting}
        onNextRound={nextRound}
      />
    );
  }

  // Describing/Drawing phase
  if (isSpeaker) {
    return (
      <SpeakerView
        gameState={gameState}
        currentRound={currentRound}
        onStartReveal={startReveal}
      />
    );
  }

  return (
    <DrawerView
      gameState={gameState}
      currentRound={currentRound}
      currentPlayer={currentPlayer}
      onSubmitDrawing={submitDrawing}
    />
  );
};
