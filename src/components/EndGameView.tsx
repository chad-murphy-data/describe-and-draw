import { useState, useCallback } from 'react';
import { GameState, Player } from '../types';
import { getDrawingById } from '../data/drawings';
import { CeremonyOrchestrator } from './ceremony';
import { useIsMobile } from '../hooks/useIsMobile';

interface EndGameViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export const EndGameView = ({ gameState, currentPlayer, onPlayAgain, onLeave }: EndGameViewProps) => {
  const [showCeremony, setShowCeremony] = useState(true);
  const [ceremonyComplete, setCeremonyComplete] = useState(false);
  const isMobile = useIsMobile();

  const getPlayerName = (playerId: string) => {
    return gameState.players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Skip ceremony on mobile or if scoring is disabled
  const shouldShowCeremony = showCeremony &&
    !ceremonyComplete &&
    !isMobile &&
    gameState.config.scoringEnabled &&
    gameState.rounds.length > 0;

  const handleCeremonyComplete = useCallback(() => {
    setCeremonyComplete(true);
    setShowCeremony(false);
  }, []);

  const handleSkipCeremony = useCallback(() => {
    setCeremonyComplete(true);
    setShowCeremony(false);
  }, []);

  // Show ceremony if applicable
  if (shouldShowCeremony) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <CeremonyOrchestrator
          gameState={gameState}
          onCeremonyComplete={handleCeremonyComplete}
          onSkip={handleSkipCeremony}
          isHost={currentPlayer.isHost}
        />
      </div>
    );
  }

  // Calculate scores for static leaderboard
  const playerScores: Record<string, { totalScore: number; totalVotes: number; submissions: number }> = {};

  gameState.players.forEach(player => {
    playerScores[player.id] = { totalScore: 0, totalVotes: 0, submissions: 0 };
  });

  gameState.rounds.forEach(round => {
    // Count scores from submissions
    round.submissions.forEach(submission => {
      if (playerScores[submission.playerId]) {
        playerScores[submission.playerId].totalScore += submission.score || 0;
        playerScores[submission.playerId].submissions += 1;
      }
    });

    // Count votes
    Object.values(round.votes).forEach(voteeId => {
      if (playerScores[voteeId]) {
        playerScores[voteeId].totalVotes += 1;
      }
    });
  });

  // Sort by score then by votes
  const sortedPlayers = Object.entries(playerScores)
    .filter(([, stats]) => stats.submissions > 0)
    .sort((a, b) => {
      const scoreA = a[1].submissions > 0 ? a[1].totalScore / a[1].submissions : 0;
      const scoreB = b[1].submissions > 0 ? b[1].totalScore / b[1].submissions : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b[1].totalVotes - a[1].totalVotes;
    });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="text-center mb-4">
        <h1 className="mb-2">Game Over!</h1>
        <p className="text-muted">
          {gameState.rounds.length} rounds played
        </p>
      </div>

      {/* Leaderboard */}
      {(gameState.config.scoringEnabled || gameState.config.votingEnabled) && sortedPlayers.length > 0 && (
        <div className="card mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 className="text-center mb-3">Leaderboard</h2>
          <div className="flex flex-col gap-2">
            {sortedPlayers.map(([playerId, stats], index) => {
              const avgScore = stats.submissions > 0 ? Math.round(stats.totalScore / stats.submissions) : 0;
              const isCurrentPlayer = playerId === currentPlayer.id;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

              return (
                <div
                  key={playerId}
                  className="flex items-center justify-between"
                  style={{
                    padding: '0.75rem 1rem',
                    background: isCurrentPlayer ? 'rgba(233, 69, 96, 0.1)' : 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: isCurrentPlayer ? '1px solid var(--accent)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.25rem', width: '2rem' }}>{medal || `#${index + 1}`}</span>
                    <span style={{ fontWeight: isCurrentPlayer ? 600 : 400 }}>
                      {getPlayerName(playerId)}
                      {isCurrentPlayer && ' (you)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {gameState.config.scoringEnabled && (
                      <span className="text-success" style={{ fontWeight: 600 }}>
                        {avgScore}% avg
                      </span>
                    )}
                    {gameState.config.votingEnabled && (
                      <span className="text-muted">
                        {stats.totalVotes} vote{stats.totalVotes !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery of all rounds */}
      <div className="mb-4">
        <h2 className="text-center mb-3">Gallery</h2>
        {gameState.rounds.map((round) => {
          const drawing = getDrawingById(round.imageId);
          const speaker = gameState.players.find(p => p.id === round.speakerId);

          return (
            <div key={round.roundNumber} className="card mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3>Round {round.roundNumber}: {drawing?.name || 'Unknown'}</h3>
                <span className="text-muted">Speaker: {speaker?.name}</span>
              </div>

              <div className="submission-grid">
                {/* Original */}
                <div className="submission-card">
                  <div
                    style={{
                      background: 'white',
                      padding: '0.5rem',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    dangerouslySetInnerHTML={{ __html: drawing?.svg || '' }}
                  />
                  <div className="submission-card-info">
                    <strong>Original</strong>
                  </div>
                </div>

                {/* Submissions */}
                {round.submissions.map((submission) => (
                  <div key={submission.playerId} className="submission-card">
                    <img
                      src={submission.imageData}
                      alt={`Drawing by ${getPlayerName(submission.playerId)}`}
                    />
                    <div className="submission-card-info">
                      <div>{getPlayerName(submission.playerId)}</div>
                      {submission.score !== undefined && (
                        <small className="text-success">{submission.score}%</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-2">
        {currentPlayer.isHost && (
          <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
            Play Again (Same Players)
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Game
        </button>
      </div>
    </div>
  );
};
