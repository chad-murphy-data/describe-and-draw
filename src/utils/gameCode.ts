// Generate a 6-character game code that's easy to type and read
export const generateGameCode = (): string => {
  // Use only uppercase letters and numbers, excluding confusing characters (0, O, I, 1, L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate a unique player ID
export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Shuffle an array (Fisher-Yates)
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
