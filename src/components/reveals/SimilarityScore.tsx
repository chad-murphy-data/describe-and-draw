import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

interface SimilarityScoreProps {
  finalScore: number;
  animate?: boolean;
  onAnimationComplete?: () => void;
  onHighScore?: () => void; // Called when score >= 80%
}

const getScoreColor = (score: number): string => {
  if (score < 30) return '#ef4444'; // Red
  if (score < 50) return '#f97316'; // Orange
  if (score < 70) return '#eab308'; // Yellow
  if (score < 85) return '#84cc16'; // Lime
  return '#22c55e'; // Green
};

export const SimilarityScore = ({
  finalScore,
  animate = true,
  onAnimationComplete,
  onHighScore,
}: SimilarityScoreProps) => {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : finalScore);
  const [phase, setPhase] = useState<'climbing' | 'wobbling' | 'settling' | 'done'>(
    animate ? 'climbing' : 'done'
  );
  const controls = useAnimationControls();

  const runAnimation = useCallback(async () => {
    if (!animate) {
      setDisplayScore(finalScore);
      setPhase('done');
      return;
    }

    // Phase 1: Rapid climb to random value (60-80%)
    setPhase('climbing');
    const climbTarget = 60 + Math.random() * 20;
    const climbDuration = 800;
    const climbStart = Date.now();

    await new Promise<void>((resolve) => {
      const climbInterval = setInterval(() => {
        const elapsed = Date.now() - climbStart;
        const progress = Math.min(elapsed / climbDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        setDisplayScore(Math.round(eased * climbTarget));

        if (progress >= 1) {
          clearInterval(climbInterval);
          resolve();
        }
      }, 16);
    });

    // Phase 2: Wobble up and down for suspense
    setPhase('wobbling');
    const wobbleDuration = 2500;
    const wobbleStart = Date.now();
    let currentValue = climbTarget;

    await new Promise<void>((resolve) => {
      const wobbleInterval = setInterval(() => {
        const elapsed = Date.now() - wobbleStart;
        const progress = elapsed / wobbleDuration;

        if (progress >= 1) {
          clearInterval(wobbleInterval);
          resolve();
          return;
        }

        // Decrease wobble magnitude over time
        const maxDelta = 15 * (1 - progress * 0.7);
        const delta = (Math.random() - 0.5) * 2 * maxDelta;

        // Gradually drift toward final score
        const drift = (finalScore - currentValue) * 0.05;
        currentValue = currentValue + delta + drift;
        currentValue = Math.max(0, Math.min(100, currentValue));

        setDisplayScore(Math.round(currentValue));
      }, 100);
    });

    // Phase 3: Settle to final score
    setPhase('settling');
    const settleStart = Date.now();
    const settleFrom = displayScore;
    const settleDuration = 600;

    await new Promise<void>((resolve) => {
      const settleInterval = setInterval(() => {
        const elapsed = Date.now() - settleStart;
        const progress = Math.min(elapsed / settleDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 2); // Ease out quad

        const current = settleFrom + (finalScore - settleFrom) * eased;
        setDisplayScore(Math.round(current));

        if (progress >= 1) {
          clearInterval(settleInterval);
          setDisplayScore(finalScore);
          resolve();
        }
      }, 16);
    });

    // Phase 4: Lock in with pulse
    setPhase('done');
    await controls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 },
    });

    // Check for high score
    if (finalScore >= 80 && onHighScore) {
      onHighScore();
    }

    onAnimationComplete?.();
  }, [animate, finalScore, controls, onAnimationComplete, onHighScore, displayScore]);

  useEffect(() => {
    runAnimation();
  }, []);  // Only run once on mount

  const scoreColor = getScoreColor(displayScore);

  return (
    <motion.div
      className="similarity-score-container"
      animate={controls}
    >
      <motion.div
        className="similarity-score-value"
        style={{ color: scoreColor }}
        animate={{
          textShadow: phase === 'done'
            ? `0 0 20px ${scoreColor}40`
            : 'none',
        }}
      >
        {displayScore}%
      </motion.div>
      <div className="similarity-score-label">
        {phase === 'wobbling' ? 'calculating...' : 'similarity'}
      </div>
    </motion.div>
  );
};
