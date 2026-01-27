import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CurtainReveal } from './CurtainReveal';
import { SimilarityScore } from './SimilarityScore';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface DrawingRevealSequenceProps {
  drawerName: string;
  describerName: string;
  originalImage: React.ReactNode;
  submittedImage: React.ReactNode;
  similarityScore: number;
  scoringEnabled: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  isHost: boolean;
}

// Simplified phases - curtain and score now happen together
type Phase = 'tease' | 'reveal' | 'reaction' | 'complete';

const PHASE_DURATIONS: Record<Phase, number> = {
  tease: 1200,      // Shortened from 2000
  reveal: 4000,     // Curtain + score happen simultaneously
  reaction: 1200,   // Brief pause for reactions
  complete: 0,
};

export const DrawingRevealSequence = ({
  drawerName,
  describerName,
  originalImage,
  submittedImage,
  similarityScore,
  scoringEnabled,
  onComplete,
  onSkip,
  isHost,
}: DrawingRevealSequenceProps) => {
  const [phase, setPhase] = useState<Phase>('tease');
  const [curtainOpen, setCurtainOpen] = useState(false);
  const { playCurtain, playDrumroll, playDing, playCelebration } = useSoundEffects();
  const [stopDrumroll, setStopDrumroll] = useState<(() => void) | null>(null);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e94560', '#4ade80', '#fbbf24', '#60a5fa', '#a78bfa'],
    });
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((current) => {
      const phases: Phase[] = ['tease', 'reveal', 'reaction', 'complete'];
      const currentIndex = phases.indexOf(current);
      return phases[currentIndex + 1] || 'complete';
    });
  }, []);

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'complete') {
      onComplete();
      return;
    }

    // Handle phase-specific effects
    if (phase === 'reveal') {
      // Start curtain and score animation simultaneously
      setCurtainOpen(true);
      playCurtain();

      if (scoringEnabled) {
        const drumrollStop = playDrumroll();
        if (drumrollStop) {
          setStopDrumroll(() => drumrollStop);
        }
      }
    }

    // Auto-advance phases
    const duration = PHASE_DURATIONS[phase];
    if (duration > 0) {
      const timer = setTimeout(advancePhase, duration);
      return () => clearTimeout(timer);
    }
  }, [phase, advancePhase, onComplete, playCurtain, playDrumroll, scoringEnabled]);

  const handleScoreComplete = useCallback(() => {
    if (stopDrumroll) {
      stopDrumroll();
      setStopDrumroll(null);
    }
    playDing();
  }, [stopDrumroll, playDing]);

  const handleHighScore = useCallback(() => {
    triggerConfetti();
    playCelebration();
  }, [triggerConfetti, playCelebration]);

  const handleSkip = useCallback(() => {
    if (stopDrumroll) {
      stopDrumroll();
    }
    onSkip?.();
  }, [stopDrumroll, onSkip]);

  return (
    <div className="reveal-sequence">
      {/* Skip button for host */}
      {isHost && onSkip && (
        <button
          className="reveal-skip-btn"
          onClick={handleSkip}
        >
          Skip to Results
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Phase 1: Tease - shortened */}
        {phase === 'tease' && (
          <motion.div
            key="tease"
            className="reveal-phase tease-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="tease-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Let's see how <span className="highlight">{drawerName}</span> interpreted{' '}
              <span className="highlight">{describerName}</span>'s vision...
            </motion.p>
          </motion.div>
        )}

        {/* Phase 2: Reveal - curtain and score happen together */}
        {(phase === 'reveal' || phase === 'reaction') && (
          <motion.div
            key="reveal"
            className="reveal-phase reveal-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="reveal-comparison">
              {/* Original image */}
              <div className="reveal-original">
                <motion.div
                  className="reveal-image-container"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="reveal-label">Original</h4>
                  {originalImage}
                </motion.div>
              </div>

              {/* Submitted drawing with curtain */}
              <div className="reveal-submission">
                <CurtainReveal isOpen={curtainOpen}>
                  <div className="reveal-image-container">
                    <h4 className="reveal-label">{drawerName}'s Drawing</h4>
                    {submittedImage}
                  </div>
                </CurtainReveal>
              </div>
            </div>

            {/* Score display - starts immediately with curtain */}
            {scoringEnabled && (
              <motion.div
                className="reveal-score-area"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SimilarityScore
                  finalScore={similarityScore}
                  animate={phase === 'reveal'}
                  onAnimationComplete={handleScoreComplete}
                  onHighScore={handleHighScore}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
