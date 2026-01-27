import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PodiumPlayer } from '../../hooks/useAwardCalculations';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface PodiumProps {
  players: PodiumPlayer[];
  onComplete: () => void;
}

const REVEAL_DELAYS = {
  bronze: 1000,
  silver: 3500,
  gold: 6000,
};

const PODIUM_HEIGHTS = {
  1: 180, // Gold - tallest
  2: 140, // Silver
  3: 100, // Bronze
};

const MEDALS = {
  1: { emoji: '🥇', label: '1st Place', color: '#ffd700' },
  2: { emoji: '🥈', label: '2nd Place', color: '#c0c0c0' },
  3: { emoji: '🥉', label: '3rd Place', color: '#cd7f32' },
};

export const Podium = ({ players, onComplete }: PodiumProps) => {
  const [revealedPlaces, setRevealedPlaces] = useState<Set<number>>(new Set());
  const { playCelebration, playFanfare } = useSoundEffects();

  const bronze = players.find(p => p.place === 3);
  const silver = players.find(p => p.place === 2);
  const gold = players.find(p => p.place === 1);

  useEffect(() => {
    // Reveal bronze
    const bronzeTimer = setTimeout(() => {
      setRevealedPlaces(prev => new Set([...prev, 3]));
      playCelebration();
    }, REVEAL_DELAYS.bronze);

    // Reveal silver
    const silverTimer = setTimeout(() => {
      setRevealedPlaces(prev => new Set([...prev, 2]));
      playCelebration();
    }, REVEAL_DELAYS.silver);

    // Reveal gold with big celebration
    const goldTimer = setTimeout(() => {
      setRevealedPlaces(prev => new Set([...prev, 1]));
      playFanfare();

      // Big confetti burst for winner
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#ffd700', '#e94560', '#4ade80', '#60a5fa'],
      });

      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffd700', '#ffec8b'],
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffd700', '#ffec8b'],
        });
      }, 300);
    }, REVEAL_DELAYS.gold);

    // Complete ceremony
    const completeTimer = setTimeout(onComplete, REVEAL_DELAYS.gold + 4000);

    return () => {
      clearTimeout(bronzeTimer);
      clearTimeout(silverTimer);
      clearTimeout(goldTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, playCelebration, playFanfare]);

  const renderPodiumPlace = (player: PodiumPlayer | undefined, place: 1 | 2 | 3) => {
    if (!player) return null;

    const isRevealed = revealedPlaces.has(place);
    const medal = MEDALS[place];
    const height = PODIUM_HEIGHTS[place];

    return (
      <div className={`podium-place podium-place-${place}`}>
        <AnimatePresence>
          {isRevealed && (
            <>
              {/* Player info above podium */}
              <motion.div
                className="podium-player"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <motion.div
                  className="podium-medal"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                >
                  {medal.emoji}
                </motion.div>
                <div className="podium-name">{player.playerName}</div>
                <div className="podium-score">{Math.round(player.avgScore)}% avg</div>
              </motion.div>

              {/* Podium block */}
              <motion.div
                className="podium-block"
                style={{ backgroundColor: medal.color }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <span className="podium-label">{medal.label}</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="podium-container">
      <motion.h2
        className="podium-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Final Standings
      </motion.h2>

      <div className="podium-stage">
        {/* Order: Silver (2nd) - Gold (1st) - Bronze (3rd) */}
        {renderPodiumPlace(silver, 2)}
        {renderPodiumPlace(gold, 1)}
        {renderPodiumPlace(bronze, 3)}
      </div>
    </div>
  );
};
