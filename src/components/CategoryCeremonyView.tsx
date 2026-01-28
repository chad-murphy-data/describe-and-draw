import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Player, AwardCategory } from '../types';
import { AWARD_CATEGORIES, getAwardById } from '../data/awards';
import { getDrawingById } from '../data/drawings';

interface CategoryCeremonyViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onEndCeremony: () => void;
  onLeave: () => void;
}

interface AwardWinner {
  category: AwardCategory;
  winnerId: string;
  winnerName: string;
  voteCount: number;
  isTie: boolean;
  tiedWith?: string[];
}

export const CategoryCeremonyView = ({
  gameState,
  currentPlayer,
  onEndCeremony,
  onLeave,
}: CategoryCeremonyViewProps) => {
  const [currentAwardIndex, setCurrentAwardIndex] = useState(-1);
  const [showingWinner, setShowingWinner] = useState(false);
  const [ceremonyComplete, setCeremonyComplete] = useState(false);

  const getPlayerName = (playerId: string) => {
    return gameState.players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Calculate winners for each category
  const calculateWinners = useCallback((): AwardWinner[] => {
    const categoryVotes = gameState.categoryVotes || {};
    const winners: AwardWinner[] = [];

    AWARD_CATEGORIES.forEach((award) => {
      const votesForCategory: Record<string, number> = {};

      // Count votes for this category
      Object.values(categoryVotes).forEach((playerVotes) => {
        const vote = playerVotes[award.id];
        if (vote) {
          votesForCategory[vote] = (votesForCategory[vote] || 0) + 1;
        }
      });

      // Find the winner(s)
      const maxVotes = Math.max(...Object.values(votesForCategory), 0);
      const winnersForCategory = Object.entries(votesForCategory)
        .filter(([, count]) => count === maxVotes)
        .map(([id]) => id);

      if (winnersForCategory.length > 0) {
        const winnerId = winnersForCategory[0];
        const winnerName = award.votesFor === 'player'
          ? getPlayerName(winnerId)
          : `Round ${winnerId}: ${getDrawingById(gameState.rounds[parseInt(winnerId) - 1]?.imageId)?.name || 'Unknown'}`;

        winners.push({
          category: award.id,
          winnerId,
          winnerName,
          voteCount: maxVotes,
          isTie: winnersForCategory.length > 1,
          tiedWith: winnersForCategory.length > 1
            ? winnersForCategory.slice(1).map(id =>
              award.votesFor === 'player'
                ? getPlayerName(id)
                : `Round ${id}`
            )
            : undefined,
        });
      }
    });

    return winners;
  }, [gameState.categoryVotes, gameState.players, gameState.rounds]);

  const winners = calculateWinners();
  const currentWinner = currentAwardIndex >= 0 && currentAwardIndex < winners.length
    ? winners[currentAwardIndex]
    : null;
  const currentAward = currentWinner ? getAwardById(currentWinner.category) : null;

  // Auto-advance through awards
  useEffect(() => {
    if (ceremonyComplete) return;

    // Start ceremony after 2 seconds
    if (currentAwardIndex === -1) {
      const timer = setTimeout(() => {
        setCurrentAwardIndex(0);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Show winner reveal after award name appears
    if (!showingWinner) {
      const timer = setTimeout(() => {
        setShowingWinner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Move to next award after winner is shown
    const timer = setTimeout(() => {
      if (currentAwardIndex < winners.length - 1) {
        setCurrentAwardIndex(prev => prev + 1);
        setShowingWinner(false);
      } else {
        setCeremonyComplete(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [currentAwardIndex, showingWinner, winners.length, ceremonyComplete]);

  // Manual skip
  const handleSkip = () => {
    setCeremonyComplete(true);
  };

  // Intro screen
  if (currentAwardIndex === -1) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Awards Ceremony</h1>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>
            And the winners are...
          </p>
        </motion.div>
        {currentPlayer.isHost && (
          <button
            className="btn btn-secondary mt-4"
            onClick={handleSkip}
            style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}
          >
            Skip to Results
          </button>
        )}
      </div>
    );
  }

  // Ceremony complete - show all winners
  if (ceremonyComplete) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-4">
          <h1 className="mb-2">🏆 Award Winners 🏆</h1>
          <p className="text-muted">{gameState.rounds.length} rounds played</p>
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {winners.map((winner) => {
            const award = getAwardById(winner.category);
            if (!award) return null;

            return (
              <motion.div
                key={winner.category}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.5rem' }}>{award.emoji}</span>
                    <div>
                      <h4 style={{ margin: 0 }}>{award.name}</h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                        {award.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong style={{ color: 'var(--accent)' }}>{winner.winnerName}</strong>
                    {winner.isTie && winner.tiedWith && (
                      <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                        (tied with {winner.tiedWith.join(', ')})
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          {currentPlayer.isHost && (
            <button className="btn btn-primary btn-large" onClick={onEndCeremony}>
              View Final Results
            </button>
          )}
          <button className="btn btn-secondary" onClick={onLeave}>
            Leave Game
          </button>
        </div>
      </div>
    );
  }

  // Individual award reveal
  return (
    <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAwardIndex}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="text-center"
          style={{ maxWidth: '600px' }}
        >
          {currentAward && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                style={{ fontSize: '5rem', marginBottom: '1rem' }}
              >
                {currentAward.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
              >
                {currentAward.name}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted mb-4"
              >
                {currentAward.description}
              </motion.p>

              {showingWinner && currentWinner && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 8 }}
                >
                  <h1 style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>
                    {currentWinner.winnerName}
                  </h1>
                  {currentWinner.isTie && currentWinner.tiedWith && (
                    <p className="text-muted mt-2">
                      (tied with {currentWinner.tiedWith.join(', ')})
                    </p>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4" style={{ position: 'absolute', bottom: '3rem' }}>
        {winners.map((_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i <= currentAwardIndex ? 'var(--accent)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {currentPlayer.isHost && (
        <button
          className="btn btn-secondary"
          onClick={handleSkip}
          style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}
        >
          Skip to Results
        </button>
      )}
    </div>
  );
};
