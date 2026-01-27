import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Submission } from '../../types';
import { DrawingDisplay } from '../DrawingDisplay';
import { SimilarityScore } from './SimilarityScore';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface BatchRevealProps {
  imageId: string;
  submissions: Submission[];
  getPlayerName: (playerId: string) => string;
  scoringEnabled: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  isHost: boolean;
}

const REVEAL_DURATION = 5000; // Time before auto-advancing (enough for score animations)

export const BatchReveal = ({
  imageId,
  submissions,
  getPlayerName,
  scoringEnabled,
  onComplete,
  onSkip,
  isHost,
}: BatchRevealProps) => {
  const [revealed, setRevealed] = useState(false);
  const { playCurtain, playCelebration } = useSoundEffects();

  useEffect(() => {
    // Reveal all cards at once after a brief moment
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      playCurtain();
    }, 300);

    // Auto-complete after duration
    const completeTimer = setTimeout(onComplete, REVEAL_DURATION);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, playCurtain]);

  // Trigger confetti when a high score finishes animating
  const handleHighScore = useCallback(() => {
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#e94560', '#4ade80', '#fbbf24', '#60a5fa'],
    });
    playCelebration();
  }, [playCelebration]);

  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  return (
    <div className="batch-reveal-container">
      {/* Skip button */}
      {isHost && onSkip && (
        <button className="reveal-skip-btn" onClick={handleSkip}>
          Skip
        </button>
      )}

      {/* Original image centered at top */}
      <motion.div
        className="batch-reveal-original"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h4>Original</h4>
        <DrawingDisplay imageId={imageId} size="medium" />
      </motion.div>

      {/* All submissions in a grid - each with its own score animation */}
      <div className="batch-reveal-grid">
        {submissions.map((submission, index) => {
          const score = submission.score ?? 0;
          const isHighScore = score >= 80;

          return (
            <motion.div
              key={submission.playerId}
              className={`batch-reveal-card ${isHighScore ? 'high-score' : ''}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={revealed ? {
                opacity: 1,
                scale: 1,
                y: 0,
              } : {}}
              transition={{
                delay: index * 0.15,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
              }}
            >
              <div className="batch-reveal-header">
                <span className="batch-reveal-name">{getPlayerName(submission.playerId)}</span>
              </div>
              <div className="batch-reveal-image">
                <img
                  src={submission.imageData}
                  alt={`Drawing by ${getPlayerName(submission.playerId)}`}
                />
              </div>
              {/* Each card gets its own animated score */}
              {scoringEnabled && revealed && (
                <div className="batch-reveal-score-container">
                  <SimilarityScore
                    finalScore={score}
                    animate={true}
                    onHighScore={isHighScore ? handleHighScore : undefined}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
