import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

interface CurtainRevealProps {
  isOpen: boolean;
  children: ReactNode;
  onOpenComplete?: () => void;
}

export const CurtainReveal = ({ isOpen, children, onOpenComplete }: CurtainRevealProps) => {
  useEffect(() => {
    if (isOpen && onOpenComplete) {
      const timer = setTimeout(onOpenComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onOpenComplete]);

  return (
    <div className="curtain-stage">
      {/* Content behind the curtain */}
      <div className="curtain-content">
        {children}
      </div>

      {/* Curtains overlay */}
      <AnimatePresence>
        {!isOpen && (
          <>
            {/* Left curtain */}
            <motion.div
              className="curtain curtain-left"
              initial={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1], // Custom ease for fabric feel
              }}
            >
              <div className="curtain-folds" />
              <div className="curtain-trim" />
            </motion.div>

            {/* Right curtain */}
            <motion.div
              className="curtain curtain-right"
              initial={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="curtain-folds" />
              <div className="curtain-trim" />
            </motion.div>

            {/* Gold bar at top */}
            <div className="curtain-rod" />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
