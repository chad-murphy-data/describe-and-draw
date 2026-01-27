import { motion } from 'framer-motion';
import { PlayOfTheGame as PlayOfTheGameType } from '../../hooks/useAwardCalculations';
import { DrawingDisplay } from '../DrawingDisplay';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface PlayOfTheGameProps {
  play: PlayOfTheGameType;
  onComplete: () => void;
}

const DISPLAY_TIME = 6000;

export const PlayOfTheGame = ({ play, onComplete }: PlayOfTheGameProps) => {
  const { playFanfare } = useSoundEffects();

  useEffect(() => {
    // Trigger confetti and sound
    playFanfare();

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ffd700', '#e94560', '#4ade80'],
      });
    }, 500);

    const timer = setTimeout(onComplete, DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, [onComplete, playFanfare]);

  return (
    <div className="play-of-game-container">
      <motion.div
        className="play-of-game-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="play-of-game-star">⭐</span>
        <h2>Play of the Game</h2>
        <span className="play-of-game-star">⭐</span>
      </motion.div>

      <motion.div
        className="play-of-game-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="play-of-game-comparison">
          <div className="play-of-game-image">
            <h4>Original</h4>
            <DrawingDisplay imageId={play.imageId} size="medium" />
          </div>
          <div className="play-of-game-image">
            <h4>{play.drawerName}'s Drawing</h4>
            <div className="play-of-game-drawing">
              <img src={play.imageData} alt="Winning drawing" />
            </div>
          </div>
        </div>

        <motion.div
          className="play-of-game-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="play-of-game-score">{play.score}%</div>
          <div className="play-of-game-credits">
            <span className="credit-label">Described by</span>
            <span className="credit-name">{play.describerName}</span>
            <span className="credit-label">Drawn by</span>
            <span className="credit-name">{play.drawerName}</span>
          </div>
          <div className="play-of-game-round">Round {play.roundNumber}</div>
        </motion.div>
      </motion.div>
    </div>
  );
};
