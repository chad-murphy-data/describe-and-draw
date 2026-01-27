import { useState, useEffect } from 'react';
import { GameState, Player, Round, Submission } from '../types';
import { DrawingDisplay } from './DrawingDisplay';
import { getDrawingById } from '../data/drawings';
import { scoreSubmission, ScoringResult } from '../utils/imageScoring';

interface RevealViewProps {
  gameState: GameState;
  currentRound: Round;
  currentPlayer: Player;
  onRevealNext: () => void;
  onUpdateScore: (playerId: string, score: number, alignmentInfo: Submission['alignmentInfo']) => void;
  onCastVote: (playerId: string) => void;
  onEndVoting: () => void;
  onNextRound: () => void;
}

export const RevealView = ({
  gameState,
  currentRound,
  currentPlayer,
  onRevealNext,
  onUpdateScore,
  onCastVote,
  onEndVoting,
  onNextRound,
}: RevealViewProps) => {
  const [scoringResults, setScoringResults] = useState<Record<string, ScoringResult>>({});
  const [currentlyScoring, setCurrentlyScoring] = useState<string | null>(null);

  const isSpeakerOrHost = currentRound.speakerId === currentPlayer.id || currentPlayer.isHost;
  const drawing = getDrawingById(currentRound.imageId);
  const submissions = currentRound.submissions;
  const revealedSubmissions = submissions.slice(0, currentRound.revealedCount);
  const allRevealed = currentRound.revealedCount >= submissions.length;
  const isVoting = currentRound.status === 'voting';
  const isCompleted = currentRound.status === 'completed';
  const hasVoted = currentPlayer.id in currentRound.votes;

  // Score submissions as they're revealed
  useEffect(() => {
    if (!gameState.config.scoringEnabled || !drawing) {
      return;
    }

    const scoreNext = async () => {
      // Find first unscored submission
      const unscored = revealedSubmissions.find(
        s => !scoringResults[s.playerId] && currentlyScoring !== s.playerId
      );

      if (!unscored) return;

      setCurrentlyScoring(unscored.playerId);

      try {
        const result = await scoreSubmission(drawing.svg, unscored.imageData);
        setScoringResults(prev => ({ ...prev, [unscored.playerId]: result }));
        onUpdateScore(unscored.playerId, result.score, result.alignmentInfo);
      } catch (error) {
        console.error('Scoring error:', error);
      } finally {
        setCurrentlyScoring(null);
      }
    };

    scoreNext();
  }, [revealedSubmissions.length, drawing, gameState.config.scoringEnabled, scoringResults, currentlyScoring, onUpdateScore]);

  // Calculate vote counts
  const voteCounts: Record<string, number> = {};
  Object.values(currentRound.votes).forEach(voteeId => {
    voteCounts[voteeId] = (voteCounts[voteeId] || 0) + 1;
  });

  const getPlayerName = (playerId: string) => {
    return gameState.players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Get winner(s) for completed round
  const getWinners = () => {
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    if (maxVotes === 0) return [];
    return Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([playerId]) => playerId);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="text-center mb-4">
        <span className="badge badge-accent mb-2">Round {currentRound.roundNumber}</span>
        <h2 className="mb-1">
          {isCompleted
            ? 'Round Complete!'
            : isVoting
              ? 'Vote for your favorite!'
              : 'Reveal Time!'}
        </h2>
        {drawing && (
          <p className="text-muted">
            The image was: <strong>{drawing.name}</strong>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {/* Original image */}
        <div className="card text-center" style={{ width: '280px' }}>
          <h4 className="mb-2">Original</h4>
          <DrawingDisplay imageId={currentRound.imageId} size="medium" />
        </div>

        {/* Revealed submissions */}
        {revealedSubmissions.map((submission, index) => {
          const playerName = getPlayerName(submission.playerId);
          const result = scoringResults[submission.playerId];
          const votes = voteCounts[submission.playerId] || 0;
          const isWinner = isCompleted && getWinners().includes(submission.playerId);
          const myVote = currentRound.votes[currentPlayer.id] === submission.playerId;

          return (
            <div
              key={submission.playerId}
              className="card text-center reveal-card"
              style={{
                width: '280px',
                animationDelay: `${index * 0.1}s`,
                border: isWinner ? '2px solid var(--success)' : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4>{playerName}</h4>
                {isWinner && <span className="badge badge-success">Winner!</span>}
              </div>

              <div
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}
              >
                <img
                  src={submission.imageData}
                  alt={`Drawing by ${playerName}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {gameState.config.scoringEnabled && (
                <div className="mb-2">
                  {result ? (
                    <>
                      <span className="score-display">{result.score}%</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        similarity
                      </span>
                    </>
                  ) : submission.score !== undefined ? (
                    <>
                      <span className="score-display">{submission.score}%</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        similarity
                      </span>
                    </>
                  ) : currentlyScoring === submission.playerId ? (
                    <span className="text-muted">Scoring...</span>
                  ) : (
                    <span className="text-muted">Calculating...</span>
                  )}
                </div>
              )}

              {(isVoting || isCompleted) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {votes} vote{votes !== 1 ? 's' : ''}
                  </span>
                  {isVoting && submission.playerId !== currentPlayer.id && !hasVoted && (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => onCastVote(submission.playerId)}
                    >
                      Vote
                    </button>
                  )}
                  {myVote && (
                    <span className="badge badge-accent">Your vote</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control buttons */}
      <div className="flex flex-col items-center gap-2">
        {!allRevealed && isSpeakerOrHost && (
          <button className="btn btn-primary btn-large" onClick={onRevealNext}>
            Reveal Next Drawing ({currentRound.revealedCount + 1} of {submissions.length})
          </button>
        )}

        {allRevealed && !isVoting && !isCompleted && isSpeakerOrHost && (
          <button className="btn btn-primary btn-large" onClick={onRevealNext}>
            {gameState.config.votingEnabled ? 'Start Voting' : 'Complete Round'}
          </button>
        )}

        {isVoting && (
          <div className="text-center">
            {hasVoted ? (
              <>
                <p className="text-success mb-2">Your vote has been cast!</p>
                {isSpeakerOrHost && (
                  <button className="btn btn-primary" onClick={onEndVoting}>
                    End Voting
                  </button>
                )}
              </>
            ) : (
              <p className="text-muted">Select your favorite drawing above</p>
            )}
          </div>
        )}

        {isCompleted && isSpeakerOrHost && (
          <button className="btn btn-primary btn-large" onClick={onNextRound}>
            {currentRound.roundNumber < gameState.speakerOrder.length
              ? 'Next Round'
              : 'View Final Results'}
          </button>
        )}

        {!isSpeakerOrHost && !isVoting && !isCompleted && (
          <p className="text-muted">Waiting for {getPlayerName(currentRound.speakerId)} to reveal...</p>
        )}
      </div>
    </div>
  );
};
