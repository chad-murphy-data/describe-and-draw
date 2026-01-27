import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../../types';
import { useAwardCalculations } from '../../hooks/useAwardCalculations';
import { QuickFireAwards } from './QuickFireAwards';
import { PlayOfTheGame } from './PlayOfTheGame';
import { Podium } from './Podium';

interface CeremonyOrchestratorProps {
  gameState: GameState;
  onCeremonyComplete: () => void;
  onSkip?: () => void;
  isHost: boolean;
}

type CeremonyPhase = 'awards' | 'play' | 'podium' | 'complete';

export const CeremonyOrchestrator = ({
  gameState,
  onCeremonyComplete,
  onSkip,
  isHost,
}: CeremonyOrchestratorProps) => {
  const [phase, setPhase] = useState<CeremonyPhase>('awards');
  const awards = useAwardCalculations(gameState);

  const advancePhase = useCallback(() => {
    setPhase(current => {
      switch (current) {
        case 'awards':
          // Skip play of the game if no valid play
          return awards.playOfTheGame ? 'play' : 'podium';
        case 'play':
          return 'podium';
        case 'podium':
          return 'complete';
        default:
          return 'complete';
      }
    });
  }, [awards.playOfTheGame]);

  // Handle phase completion
  const handleAwardsComplete = useCallback(() => {
    advancePhase();
  }, [advancePhase]);

  const handlePlayComplete = useCallback(() => {
    advancePhase();
  }, [advancePhase]);

  const handlePodiumComplete = useCallback(() => {
    setPhase('complete');
    onCeremonyComplete();
  }, [onCeremonyComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setPhase('complete');
    onSkip?.();
  }, [onSkip]);

  return (
    <div className="ceremony-container">
      {/* Skip button for host */}
      {isHost && onSkip && phase !== 'complete' && (
        <button className="ceremony-skip-btn" onClick={handleSkip}>
          Skip Ceremony
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'awards' && awards.quickFireAwards.length > 0 && (
          <motion.div
            key="awards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuickFireAwards
              awards={awards.quickFireAwards}
              onComplete={handleAwardsComplete}
            />
          </motion.div>
        )}

        {phase === 'play' && awards.playOfTheGame && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PlayOfTheGame
              play={awards.playOfTheGame}
              onComplete={handlePlayComplete}
            />
          </motion.div>
        )}

        {phase === 'podium' && awards.podium.length > 0 && (
          <motion.div
            key="podium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Podium
              players={awards.podium}
              onComplete={handlePodiumComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
