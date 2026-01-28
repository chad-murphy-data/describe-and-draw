import { AwardCategory, AwardInfo } from '../types';

export const AWARD_CATEGORIES: AwardInfo[] = [
  {
    id: 'michelangelo',
    emoji: '🎨',
    name: 'The Michelangelo',
    description: 'Best drawing overall',
    votesFor: 'player',
  },
  {
    id: 'happyAccident',
    emoji: '😂',
    name: 'The Happy Accident',
    description: 'Funniest (intentional or not)',
    votesFor: 'player',
  },
  {
    id: 'scenicRoute',
    emoji: '🛤️',
    name: 'The Scenic Route',
    description: 'Most creative interpretation',
    votesFor: 'player',
  },
  {
    id: 'translator',
    emoji: '🗣️',
    name: 'The Translator',
    description: 'Best at describing',
    votesFor: 'player',
  },
  {
    id: 'blamePrompt',
    emoji: '🎯',
    name: 'Blame the Prompt',
    description: 'Hardest image to communicate',
    votesFor: 'round',
  },
];

export const getAwardById = (id: AwardCategory): AwardInfo | undefined => {
  return AWARD_CATEGORIES.find(a => a.id === id);
};
