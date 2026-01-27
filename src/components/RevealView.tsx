import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Round, Submission } from '../types';
import { DrawingDisplay } from './DrawingDisplay';
import { getDrawingById } from '../data/drawings';
import { scoreSubmission, ScoringResult } from '../utils/imageScoring';
import { DrawingRevealSequence, BatchReveal } from './reveals';
import { useIsMobile } from '../hooks/useIsMobile';

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
  const [showingDramaticReveal, setShowingDramaticReveal] = useState(false);
  const [dramaticRevealIndex, setDramaticRevealIndex] = useState(-1);
  const [pendingScore, setPendingScore] = useState<{ playerId: string; score: number; alignmentInfo: Submission['alignmentInfo'] } | null>(null);
  const [showingBatchReveal, setShowingBatchReveal] = useState(false);

  const isMobile = useIsMobile();
  const isSpeakerOrHost = currentRound.speakerId === currentPlayer.id || currentPlayer.isHost;
  const drawing = getDrawingById(currentRound.imageId);
  const submissions = currentRound.submissions;
  const revealedSubmissions = submissions.slice(0, currentRound.revealedCount);
  const allRevealed = currentRound.revealedCount >= submissions.length;
  const isVoting = currentRound.status === 'voting';
  const isCompleted = currentRound.status === 'completed';
  const hasVoted = currentPlayer.id in currentRound.votes;

  // Round 1 gets dramatic per-drawing reveals, rounds 2+ get batch reveal
  const isFirstRound = currentRound.roundNumber === 1;

  // Get the submission currently being dramatically revealed
  const currentDramaticSubmission = dramaticRevealIndex >= 0 ? submissions[dramaticRevealIndex] : null;

  // Pre-score ALL submissions for batch reveal
  useEffect(() => {
    if (!showingBatchReveal || !drawing || !gameState.config.scoringEnabled || !isSpeakerOrHost) {
      return;
    }

    const scoreAll = async () => {
      for (const submission of submissions) {
        if (submission.score !== undefined || scoringResults[submission.playerId]) {
          continue;
        }

        try {
          const result = await scoreSubmission(drawing.svg, submission.imageData);
          setScoringResults(prev => ({ ...prev, [submission.playerId]: result }));
          onUpdateScore(submission.playerId, result.score, result.alignmentInfo);
        } catch (error) {
          console.error('Scoring error:', error);
        }
      }
    };

    scoreAll();
  }, [showingBatchReveal, drawing, gameState.config.scoringEnabled, submissions, scoringResults, onUpdateScore, isSpeakerOrHost]);

  // Pre-score the submission being dramatically revealed (round 1)
  useEffect(() => {
    if (!showingDramaticReveal || !currentDramaticSubmission || !drawing || !gameState.config.scoringEnabled) {
      return;
    }

    if (scoringResults[currentDramaticSubmission.playerId] || currentDramaticSubmission.score !== undefined) {
      return;
    }

    if (!isSpeakerOrHost) return;

    const calculateScore = async () => {
      try {
        const result = await scoreSubmission(drawing.svg, currentDramaticSubmission.imageData);
        setScoringResults(prev => ({ ...prev, [currentDramaticSubmission.playerId]: result }));
        setPendingScore({
          playerId: currentDramaticSubmission.playerId,
          score: result.score,
          alignmentInfo: result.alignmentInfo,
        });
      } catch (error) {
        console.error('Scoring error:', error);
      }
    };

    calculateScore();
  }, [showingDramaticReveal, currentDramaticSubmission, drawing, gameState.config.scoringEnabled, scoringResults, isSpeakerOrHost]);

  // Score already-revealed submissions that don't have scores yet
  useEffect(() => {
    if (!gameState.config.scoringEnabled || !drawing || !isSpeakerOrHost || showingDramaticReveal || showingBatchReveal) {
      return;
    }

    const scoreNext = async () => {
      const unscored = revealedSubmissions.find(
        s => s.score === undefined && !scoringResults[s.playerId] && currentlyScoring !== s.playerId
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
  }, [revealedSubmissions.length, drawing, gameState.config.scoringEnabled, scoringResults, currentlyScoring, onUpdateScore, isSpeakerOrHost, showingDramaticReveal, showingBatchReveal]);

  // Calculate vote counts
  const voteCounts: Record<string, number> = {};
  Object.values(currentRound.votes).forEach(voteeId => {
    voteCounts[voteeId] = (voteCounts[voteeId] || 0) + 1;
  });

  const getPlayerName = (playerId: string) => {
    return gameState.players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const getWinners = () => {
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    if (maxVotes === 0) return [];
    return Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([playerId]) => playerId);
  };

  // Handle starting a reveal (dramatic for round 1, batch for rounds 2+)
  const handleRevealNext = useCallback(() => {
    // On mobile or for non-hosts, skip all animations
    if (isMobile || !isSpeakerOrHost) {
      // Reveal all at once
      for (let i = currentRound.revealedCount; i < submissions.length; i++) {
        onRevealNext();
      }
      return;
    }

    // Round 1: Dramatic per-drawing reveal
    if (isFirstRound) {
      const nextIndex = currentRound.revealedCount;
      if (nextIndex >= submissions.length) {
        onRevealNext();
        return;
      }
      setDramaticRevealIndex(nextIndex);
      setShowingDramaticReveal(true);
      return;
    }

    // Rounds 2+: Batch reveal all at once
    if (currentRound.revealedCount === 0 && submissions.length > 0) {
      setShowingBatchReveal(true);
    } else {
      onRevealNext();
    }
  }, [currentRound.revealedCount, submissions.length, isMobile, isSpeakerOrHost, isFirstRound, onRevealNext]);

  // Handle dramatic reveal completion (round 1)
  const handleDramaticRevealComplete = useCallback(() => {
    if (pendingScore) {
      onUpdateScore(pendingScore.playerId, pendingScore.score, pendingScore.alignmentInfo);
      setPendingScore(null);
    }

    setShowingDramaticReveal(false);
    setDramaticRevealIndex(-1);
    onRevealNext();
  }, [pendingScore, onUpdateScore, onRevealNext]);

  // Handle skip for dramatic reveal
  const handleSkipDramaticReveal = useCallback(() => {
    if (pendingScore) {
      onUpdateScore(pendingScore.playerId, pendingScore.score, pendingScore.alignmentInfo);
      setPendingScore(null);
    }
    setShowingDramaticReveal(false);
    setDramaticRevealIndex(-1);
    onRevealNext();
  }, [pendingScore, onUpdateScore, onRevealNext]);

  // Handle batch reveal completion (rounds 2+)
  const handleBatchRevealComplete = useCallback(() => {
    setShowingBatchReveal(false);
    // Reveal all submissions at once
    for (let i = 0; i < submissions.length; i++) {
      onRevealNext();
    }
  }, [submissions.length, onRevealNext]);

  // Handle skip for batch reveal
  const handleSkipBatchReveal = useCallback(() => {
    setShowingBatchReveal(false);
    for (let i = 0; i < submissions.length; i++) {
      onRevealNext();
    }
  }, [submissions.length, onRevealNext]);

  // Get score for the dramatic reveal
  const getDramaticScore = (): number => {
    if (!currentDramaticSubmission) return 0;
    if (pendingScore?.playerId === currentDramaticSubmission.playerId) {
      return pendingScore.score;
    }
    if (scoringResults[currentDramaticSubmission.playerId]) {
      return scoringResults[currentDramaticSubmission.playerId].score;
    }
    if (currentDramaticSubmission.score !== undefined) {
      return currentDramaticSubmission.score;
    }
    return 0;
  };

  // Get submissions with scores for batch reveal
  const getSubmissionsWithScores = (): Submission[] => {
    return submissions.map(s => ({
      ...s,
      score: s.score ?? scoringResults[s.playerId]?.score ?? 0,
    }));
  };

  // Show dramatic reveal sequence (round 1 only)
  if (showingDramaticReveal && currentDramaticSubmission && drawing) {
    const drawerName = getPlayerName(currentDramaticSubmission.playerId);
    const describerName = getPlayerName(currentRound.speakerId);

    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-2">
          <span className="badge badge-accent">Round {currentRound.roundNumber}</span>
        </div>
        <DrawingRevealSequence
          drawerName={drawerName}
          describerName={describerName}
          originalImage={<DrawingDisplay imageId={currentRound.imageId} size="medium" />}
          submittedImage={
            <img
              src={currentDramaticSubmission.imageData}
              alt={`Drawing by ${drawerName}`}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'contain',
                background: 'white',
                borderRadius: '8px',
              }}
            />
          }
          similarityScore={getDramaticScore()}
          scoringEnabled={gameState.config.scoringEnabled}
          onComplete={handleDramaticRevealComplete}
          onSkip={handleSkipDramaticReveal}
          isHost={currentPlayer.isHost}
        />
      </div>
    );
  }

  // Show batch reveal (rounds 2+)
  if (showingBatchReveal && drawing) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-2">
          <span className="badge badge-accent">Round {currentRound.roundNumber}</span>
        </div>
        <BatchReveal
          imageId={currentRound.imageId}
          submissions={getSubmissionsWithScores()}
          getPlayerName={getPlayerName}
          scoringEnabled={gameState.config.scoringEnabled}
          onComplete={handleBatchRevealComplete}
          onSkip={handleSkipBatchReveal}
          isHost={currentPlayer.isHost}
        />
      </div>
    );
  }

  // Standard reveal grid view
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
          <button className="btn btn-primary btn-large" onClick={handleRevealNext}>
            {isFirstRound
              ? `Reveal Next Drawing (${currentRound.revealedCount + 1} of ${submissions.length})`
              : 'Reveal All Drawings'}
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
