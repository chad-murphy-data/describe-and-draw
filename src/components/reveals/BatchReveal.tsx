import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Submission } from '../../types';
import { DrawingDisplay } from '../DrawingDisplay';
import { SimilarityScore } from './SimilarityScore';
import { CurtainReveal } from './CurtainReveal';
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

const CURTAIN_OPEN_DELAY = 800; // Time before curtains start opening
const REVEAL_DURATION = 6000; // Time before auto-advancing (enough for curtains + score animations)

export const BatchReveal = ({
  imageId,
  submissions,
  getPlayerName,
  scoringEnabled,
  onComplete,
  onSkip,
  isHost,
}: BatchRevealProps) => {
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const { playCurtain, playCelebration } = useSoundEffects();

  useEffect(() => {
    // First show the cards (with curtains closed)
    const showCardsTimer = setTimeout(() => {
      setCardsVisible(true);
    }, 300);

    // Then open all curtains simultaneously
    const curtainTimer = setTimeout(() => {
      setCurtainsOpen(true);
      playCurtain();
    }, CURTAIN_OPEN_DELAY);

    // Auto-complete after duration
    const completeTimer = setTimeout(onComplete, REVEAL_DURATION);

    return () => {
      clearTimeout(showCardsTimer);
      clearTimeout(curtainTimer);
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

      {/* All submissions in a grid - each with curtain reveal */}
      <div className="batch-reveal-grid">
        {submissions.map((submission, index) => {
          const score = submission.score ?? 0;
          const isHighScore = score >= 80;

          return (
            <motion.div
              key={submission.playerId}
              className={`batch-reveal-card ${isHighScore && curtainsOpen ? 'high-score' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={cardsVisible ? {
                opacity: 1,
                scale: 1,
              } : {}}
              transition={{
                delay: index * 0.1,
                duration: 0.3,
              }}
            >
              <div className="batch-reveal-header">
                <span className="batch-reveal-name">{getPlayerName(submission.playerId)}</span>
              </div>
              <CurtainReveal isOpen={curtainsOpen}>
                <div className="batch-reveal-image">
                  <img
                    src={submission.imageData}
                    alt={`Drawing by ${getPlayerName(submission.playerId)}`}
                  />
                </div>
              </CurtainReveal>
              {/* Each card gets its own animated score - shows after curtains open */}
              {scoringEnabled && curtainsOpen && (
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
