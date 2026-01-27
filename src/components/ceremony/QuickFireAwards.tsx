import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from '../../hooks/useAwardCalculations';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface QuickFireAwardsProps {
  awards: Award[];
  onComplete: () => void;
}

const AWARD_DISPLAY_TIME = 2500; // Time each award is shown

export const QuickFireAwards = ({ awards, onComplete }: QuickFireAwardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(-1); // Start at -1 for intro
  const { playWhoosh, playCelebration } = useSoundEffects();

  useEffect(() => {
    if (awards.length === 0) {
      onComplete();
      return;
    }

    // Start showing awards
    const timer = setTimeout(() => {
      setCurrentIndex(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [awards.length, onComplete]);

  useEffect(() => {
    if (currentIndex < 0) return;

    if (currentIndex >= awards.length) {
      // All awards shown
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }

    // Play sounds
    playWhoosh();
    setTimeout(() => playCelebration(), 300);

    // Advance to next award
    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, AWARD_DISPLAY_TIME);

    return () => clearTimeout(timer);
  }, [currentIndex, awards.length, onComplete, playWhoosh, playCelebration]);

  const currentAward = currentIndex >= 0 && currentIndex < awards.length ? awards[currentIndex] : null;

  return (
    <div className="quick-fire-container">
      <motion.h2
        className="quick-fire-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Awards
      </motion.h2>

      <div className="quick-fire-stage">
        <AnimatePresence mode="wait">
          {currentAward && (
            <motion.div
              key={currentAward.id}
              className="quick-fire-award"
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="award-emoji-large"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
              >
                {currentAward.emoji}
              </motion.div>
              <motion.h3
                className="award-name-large"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentAward.name}
              </motion.h3>
              <motion.div
                className="award-winner-large"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                {currentAward.winnerName}
              </motion.div>
              {currentAward.value && (
                <motion.div
                  className="award-value-large"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {currentAward.value}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="quick-fire-progress">
        {awards.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${index === currentIndex ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};
