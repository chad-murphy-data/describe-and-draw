import { motion } from 'framer-motion';
import { Award } from '../../hooks/useAwardCalculations';

interface AwardCardProps {
  award: Award;
  animate?: boolean;
  delay?: number;
}

export const AwardCard = ({ award, animate = true, delay = 0 }: AwardCardProps) => {
  return (
    <motion.div
      className="award-card"
      initial={animate ? { opacity: 0, x: -50, scale: 0.9 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
      }}
    >
      <div className="award-emoji">{award.emoji}</div>
      <div className="award-content">
        <h3 className="award-name">{award.name}</h3>
        <p className="award-winner">{award.winnerName}</p>
        {award.value && <span className="award-value">{award.value}</span>}
      </div>
    </motion.div>
  );
};
