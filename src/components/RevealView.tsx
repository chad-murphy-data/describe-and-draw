import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Round, Submission, VotingStyle } from '../types';
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
  onCastVote: (playerId: string) => void; // Legacy single vote (kept for backwards compatibility)
  onCastRankedVote: (rankedPicks: string[]) => void;
  onEndVoting: () => void;
  onNextRound: () => void;
}

// Get required number of picks based on voting style
const getRequiredPicks = (style: VotingStyle): number => {
  if (style === 'top2') return 2;
  if (style === 'top3') return 3;
  return 0;
};

// Calculate points for a given rank
const getPointsForRank = (rank: number, style: VotingStyle): number => {
  if (style === 'top2') {
    return rank === 0 ? 2 : rank === 1 ? 1 : 0;
  }
  if (style === 'top3') {
    return rank === 0 ? 3 : rank === 1 ? 2 : rank === 2 ? 1 : 0;
  }
  return 0;
};

export const RevealView = ({
  gameState,
  currentRound,
  currentPlayer,
  onRevealNext,
  onUpdateScore,
  onCastVote: _onCastVote, // Legacy - kept for backwards compatibility
  onCastRankedVote,
  onEndVoting,
  onNextRound,
}: RevealViewProps) => {
  const [scoringResults, setScoringResults] = useState<Record<string, ScoringResult>>({});
  const [currentlyScoring, setCurrentlyScoring] = useState<string | null>(null);
  const [showingDramaticReveal, setShowingDramaticReveal] = useState(false);
  const [dramaticRevealIndex, setDramaticRevealIndex] = useState(-1);
  const [pendingScore, setPendingScore] = useState<{ playerId: string; score: number; alignmentInfo: Submission['alignmentInfo'] } | null>(null);
  const [showingBatchReveal, setShowingBatchReveal] = useState(false);
  const [showingHostPrompt, setShowingHostPrompt] = useState(false);
  const [showingHoldUpMoment, setShowingHoldUpMoment] = useState(false);
  const [rankedPicks, setRankedPicks] = useState<string[]>([]);

  const isMobile = useIsMobile();
  const votingStyle = gameState.config.votingStyle || 'top3';
  const requiredPicks = getRequiredPicks(votingStyle);
  const isSpeakerOrHost = currentRound.speakerId === currentPlayer.id || currentPlayer.isHost;
  const drawing = getDrawingById(currentRound.imageId);
  const submissions = currentRound.submissions;
  const revealedSubmissions = submissions.slice(0, currentRound.revealedCount);
  const allRevealed = currentRound.revealedCount >= submissions.length;
  const isVoting = currentRound.status === 'voting';
  const isCompleted = currentRound.status === 'completed';

  // Round 1 gets dramatic per-drawing reveals, rounds 2+ get batch reveal
  // For simple mode (paper), we show "Hold up drawings!" instead
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

  // Calculate vote counts/points based on voting style
  const voteCounts: Record<string, number> = {};

  if (votingStyle === 'none') {
    // No voting
  } else if (currentRound.rankedVotes && Object.keys(currentRound.rankedVotes).length > 0) {
    // Use ranked votes (new system)
    Object.values(currentRound.rankedVotes).forEach(picks => {
      picks.forEach((playerId, rank) => {
        const points = getPointsForRank(rank, votingStyle);
        voteCounts[playerId] = (voteCounts[playerId] || 0) + points;
      });
    });
  } else {
    // Fallback to legacy single votes
    Object.values(currentRound.votes).forEach(voteeId => {
      voteCounts[voteeId] = (voteCounts[voteeId] || 0) + 1;
    });
  }

  // Check if current player has voted (ranked or legacy)
  const hasVotedRanked = currentRound.rankedVotes && currentPlayer.id in currentRound.rankedVotes;
  const hasVotedLegacy = currentPlayer.id in currentRound.votes;
  const hasVoted = hasVotedRanked || hasVotedLegacy;

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

  // Handle starting a reveal (dramatic for round 1, batch for rounds 2+, hold-up for simple mode)
  const handleRevealNext = useCallback(() => {
    const isSimpleMode = gameState.config.gameMode === 'simple';

    // Show host screenshare prompt before any reveals (first time only)
    if (currentRound.revealedCount === 0 && !showingHostPrompt && !showingHoldUpMoment && !showingDramaticReveal && !showingBatchReveal) {
      setShowingHostPrompt(true);
      return;
    }

    // After host prompt, transition to the appropriate reveal
    if (showingHostPrompt) {
      setShowingHostPrompt(false);

      // Simple mode: Show "hold up drawings" screen
      if (isSimpleMode) {
        setShowingHoldUpMoment(true);
        return;
      }

      // Canvas mode: Skip to mobile handling or animation reveals below
    }

    // On mobile or for non-hosts, skip all animations
    if (isMobile || !isSpeakerOrHost) {
      // Reveal all at once
      for (let i = currentRound.revealedCount; i < submissions.length; i++) {
        onRevealNext();
      }
      return;
    }

    // Round 1: Dramatic per-drawing reveal (for canvas mode)
    if (isFirstRound && !isSimpleMode) {
      const nextIndex = currentRound.revealedCount;
      if (nextIndex >= submissions.length) {
        onRevealNext();
        return;
      }
      setDramaticRevealIndex(nextIndex);
      setShowingDramaticReveal(true);
      return;
    }

    // Rounds 2+: Batch reveal all at once (for canvas mode)
    if (currentRound.revealedCount === 0 && submissions.length > 0 && !isSimpleMode) {
      setShowingBatchReveal(true);
    } else {
      onRevealNext();
    }
  }, [currentRound.revealedCount, submissions.length, isMobile, isSpeakerOrHost, isFirstRound, onRevealNext, gameState.config.gameMode, showingHoldUpMoment, showingHostPrompt, showingDramaticReveal, showingBatchReveal]);

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

  // Handle "Hold up your drawings!" completion for simple/paper mode
  const handleHoldUpComplete = useCallback(() => {
    setShowingHoldUpMoment(false);
    // For simple mode, just reveal all at once (no submissions to show)
    for (let i = currentRound.revealedCount; i < submissions.length; i++) {
      onRevealNext();
    }
  }, [currentRound.revealedCount, submissions.length, onRevealNext]);

  // Handle ranked vote selection
  const handleToggleRankedPick = useCallback((playerId: string) => {
    setRankedPicks(prev => {
      if (prev.includes(playerId)) {
        // Remove from picks
        return prev.filter(id => id !== playerId);
      } else if (prev.length < requiredPicks) {
        // Add to picks
        return [...prev, playerId];
      }
      return prev;
    });
  }, [requiredPicks]);

  // Submit ranked vote
  const handleSubmitRankedVote = useCallback(() => {
    if (rankedPicks.length === requiredPicks) {
      onCastRankedVote(rankedPicks);
      setRankedPicks([]);
    }
  }, [rankedPicks, requiredPicks, onCastRankedVote]);

  // Get rank badge for a player in current picks
  const getRankBadge = (playerId: string): string | null => {
    const index = rankedPicks.indexOf(playerId);
    if (index === -1) return null;
    if (index === 0) return '1st';
    if (index === 1) return '2nd';
    if (index === 2) return '3rd';
    return null;
  };

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

  // Show host screenshare prompt before reveals
  if (showingHostPrompt) {
    const isSimpleMode = gameState.config.gameMode === 'simple';
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center" style={{ maxWidth: '500px' }}>
          <span className="badge badge-accent mb-3">Round {currentRound.roundNumber}</span>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Host, share your screen!
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
            Everyone should see your screen before the big reveal
          </p>

          {isSpeakerOrHost && (
            <button
              className="btn btn-primary btn-large"
              onClick={handleRevealNext}
            >
              {isSimpleMode ? 'Continue to Reveal' : 'Start the Reveal!'}
            </button>
          )}

          {!isSpeakerOrHost && (
            <p className="text-muted">Waiting for host...</p>
          )}
        </div>
      </div>
    );
  }

  // Show "Hold up your drawings!" moment for simple/paper mode
  if (showingHoldUpMoment && drawing) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center" style={{ maxWidth: '500px' }}>
          <span className="badge badge-accent mb-3">Round {currentRound.roundNumber}</span>

          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Hold up your drawings!
          </h1>

          <p className="text-muted mb-4" style={{ fontSize: '1.2rem' }}>
            Everyone show your paper drawings to the camera
          </p>

          <div className="mb-4">
            <DrawingDisplay imageId={currentRound.imageId} size="medium" />
            <p className="text-muted mt-2">The image was: <strong>{drawing.name}</strong></p>
          </div>

          {isSpeakerOrHost && (
            <button
              className="btn btn-primary btn-large"
              onClick={handleHoldUpComplete}
            >
              {gameState.config.votingStyle !== 'none' ? 'Continue to Voting' : 'Next Round'}
            </button>
          )}

          {!isSpeakerOrHost && (
            <p className="text-muted">Waiting for host to continue...</p>
          )}
        </div>
      </div>
    );
  }

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

  // Simple mode (paper drawings): Show voting for players, not digital submissions
  const isSimpleMode = gameState.config.gameMode === 'simple';

  // Get list of players who can be voted for (everyone except speaker and self)
  const votablePlayers = gameState.players.filter(
    p => p.id !== currentRound.speakerId && p.id !== currentPlayer.id
  );

  if (isSimpleMode && (isVoting || isCompleted)) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-4">
          <span className="badge badge-accent mb-2">Round {currentRound.roundNumber}</span>
          <h2 className="mb-1">
            {isCompleted
              ? 'Round Complete!'
              : 'Vote for your favorites!'}
          </h2>
          {drawing && (
            <p className="text-muted">
              The image was: <strong>{drawing.name}</strong>
            </p>
          )}
        </div>

        {/* Original image */}
        <div className="flex justify-center mb-4">
          <div className="card text-center" style={{ width: '280px' }}>
            <h4 className="mb-2">Original</h4>
            <DrawingDisplay imageId={currentRound.imageId} size="medium" />
          </div>
        </div>

        {/* Voting for players (simple mode) */}
        {votingStyle !== 'none' && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {votablePlayers.map((player) => {
              const points = voteCounts[player.id] || 0;
              const isWinner = isCompleted && getWinners().includes(player.id);
              const rankBadge = getRankBadge(player.id);
              const isSelected = rankedPicks.includes(player.id);
              const myRankedVote = currentRound.rankedVotes?.[currentPlayer.id];
              const myRankForThis = myRankedVote?.indexOf(player.id) ?? -1;

              return (
                <div
                  key={player.id}
                  className="card text-center"
                  style={{
                    width: '180px',
                    padding: '1rem',
                    border: isWinner
                      ? '2px solid var(--success)'
                      : isSelected
                        ? '2px solid var(--accent)'
                        : undefined,
                  }}
                >
                  <h4 className="mb-2">{player.name}</h4>

                  {(isVoting || isCompleted) && (
                    <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                      {points} pt{points !== 1 ? 's' : ''}
                    </p>
                  )}

                  {isWinner && <span className="badge badge-success mb-2">Winner!</span>}
                  {rankBadge && !hasVoted && <span className="badge badge-accent mb-2">{rankBadge}</span>}

                  {isVoting && !hasVoted && (
                    <button
                      className={`btn btn-small ${isSelected ? 'btn-accent' : 'btn-primary'}`}
                      onClick={() => handleToggleRankedPick(player.id)}
                    >
                      {isSelected ? 'Remove' : 'Select'}
                    </button>
                  )}

                  {hasVoted && myRankForThis >= 0 && (
                    <span className="badge badge-accent">
                      Your {myRankForThis === 0 ? '1st' : myRankForThis === 1 ? '2nd' : '3rd'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Voting controls */}
        <div className="flex flex-col items-center gap-2">
          {isVoting && votingStyle !== 'none' && !hasVoted && votablePlayers.length > 0 && (
            <div className="text-center">
              <p className="text-muted mb-2">
                Select your top {requiredPicks} ({rankedPicks.length}/{requiredPicks} selected)
              </p>
              {rankedPicks.length > 0 && (
                <div className="flex gap-2 items-center mb-2 flex-wrap justify-center">
                  {rankedPicks.map((id, i) => (
                    <span key={id} className="badge badge-accent">
                      {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}: {getPlayerName(id)}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="btn btn-primary btn-large"
                onClick={handleSubmitRankedVote}
                disabled={rankedPicks.length !== requiredPicks}
              >
                Submit Votes
              </button>
            </div>
          )}

          {isVoting && hasVoted && (
            <div className="text-center">
              <p className="text-success mb-2">Your votes have been cast!</p>
            </div>
          )}

          {/* Speaker/Host can always end voting */}
          {isVoting && isSpeakerOrHost && (
            <button className="btn btn-primary btn-large" onClick={onEndVoting}>
              {votingStyle === 'none' ? 'Continue' : 'End Voting'}
            </button>
          )}

          {isCompleted && isSpeakerOrHost && (
            <button className="btn btn-primary btn-large" onClick={onNextRound}>
              {currentRound.roundNumber < gameState.speakerOrder.length
                ? 'Next Round'
                : 'View Final Results'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Standard reveal grid view (for canvas mode with digital submissions)
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
          const points = voteCounts[submission.playerId] || 0;
          const isWinner = isCompleted && getWinners().includes(submission.playerId);
          const isOwnSubmission = submission.playerId === currentPlayer.id;
          const rankBadge = getRankBadge(submission.playerId);
          const isSelected = rankedPicks.includes(submission.playerId);

          // Check if this player received any ranked votes from current player
          const myRankedVote = currentRound.rankedVotes?.[currentPlayer.id];
          const myRankForThis = myRankedVote?.indexOf(submission.playerId) ?? -1;

          return (
            <div
              key={submission.playerId}
              className="card text-center reveal-card"
              style={{
                width: '280px',
                animationDelay: `${index * 0.1}s`,
                border: isWinner
                  ? '2px solid var(--success)'
                  : isSelected
                    ? '2px solid var(--accent)'
                    : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4>{playerName}</h4>
                {isWinner && <span className="badge badge-success">Winner!</span>}
                {rankBadge && <span className="badge badge-accent">{rankBadge}</span>}
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

              {/* Show points in voting/completed phases */}
              {(isVoting || isCompleted) && votingStyle !== 'none' && (
                <div className="flex items-center justify-between">
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {points} pt{points !== 1 ? 's' : ''}
                  </span>

                  {/* Ranked voting: Select button (not for own submission) */}
                  {isVoting && !isOwnSubmission && !hasVoted && (
                    <button
                      className={`btn btn-small ${isSelected ? 'btn-accent' : 'btn-primary'}`}
                      onClick={() => handleToggleRankedPick(submission.playerId)}
                    >
                      {isSelected ? `${rankBadge} - Tap to remove` : `Select`}
                    </button>
                  )}

                  {/* Show what rank this player got from current player */}
                  {hasVoted && myRankForThis >= 0 && (
                    <span className="badge badge-accent">
                      Your {myRankForThis === 0 ? '1st' : myRankForThis === 1 ? '2nd' : '3rd'}
                    </span>
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
            {gameState.config.gameMode === 'simple'
              ? 'Show "Hold Up Drawings!" Screen'
              : isFirstRound
                ? `Reveal Next Drawing (${currentRound.revealedCount + 1} of ${submissions.length})`
                : 'Reveal All Drawings'}
          </button>
        )}

        {allRevealed && !isVoting && !isCompleted && isSpeakerOrHost && (
          <button className="btn btn-primary btn-large" onClick={onRevealNext}>
            {gameState.config.votingEnabled ? 'Start Voting' : 'Complete Round'}
          </button>
        )}

        {isVoting && votingStyle !== 'none' && (
          <div className="text-center">
            {hasVoted ? (
              <p className="text-success mb-2">Your votes have been cast!</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted">
                  Select your top {requiredPicks} favorite drawings ({rankedPicks.length}/{requiredPicks} selected)
                </p>
                {rankedPicks.length > 0 && (
                  <div className="flex gap-2 items-center mb-2">
                    <span className="text-muted">Your picks:</span>
                    {rankedPicks.map((id, i) => (
                      <span key={id} className="badge badge-accent">
                        {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}: {getPlayerName(id)}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmitRankedVote}
                  disabled={rankedPicks.length !== requiredPicks}
                >
                  Submit Votes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Speaker/Host can always end voting */}
        {isVoting && isSpeakerOrHost && (
          <button className="btn btn-primary btn-large" onClick={onEndVoting}>
            {votingStyle === 'none' ? 'Continue' : 'End Voting'}
          </button>
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
