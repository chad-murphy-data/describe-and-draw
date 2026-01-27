import { DrawingImage } from '../types';

export const drawings: DrawingImage[] = [
  // EASY - Basic shapes and simple objects
  {
    id: 'house',
    name: 'House',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 L50 20 L80 50 L80 85 L20 85 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 85 L40 65 L60 65 L60 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 55 L30 45 L40 45 L40 55 L30 55" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'tree',
    name: 'Tree',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M45 90 L45 60 L55 60 L55 90" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="40" rx="25" ry="30" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'star',
    name: 'Star',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10 L58 38 L88 38 L64 55 L73 85 L50 68 L27 85 L36 55 L12 38 L42 38 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'heart',
    name: 'Heart',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 85 C20 55 10 35 30 20 C40 15 50 25 50 35 C50 25 60 15 70 20 C90 35 80 55 50 85 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'sun',
    name: 'Sun',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 10 L50 25" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 75 L50 90" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M10 50 L25 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M75 50 L90 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M22 22 L32 32" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M68 68 L78 78" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M78 22 L68 32" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M32 68 L22 78" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'flower',
    name: 'Flower',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="22" rx="8" ry="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="58" rx="8" ry="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="32" cy="40" rx="12" ry="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="68" cy="40" rx="12" ry="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 52 L50 90" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 70 L35 60" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 75 L65 65" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },

  // MEDIUM - More complex objects
  {
    id: 'bicycle',
    name: 'Bicycle',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="60" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="75" cy="60" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M25 60 L45 35 L55 35 L75 60" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 35 L40 60 L55 60" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 35 L50 25" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M55 35 L60 25 L55 25" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'umbrella',
    name: 'Umbrella',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 50 C15 25 85 25 85 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M25 50 C25 45 35 45 35 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 50 C45 45 55 45 55 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M65 50 C65 45 75 45 75 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 50 L50 80" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 80 C40 80 40 88 48 88" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'coffee',
    name: 'Coffee Cup',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 35 L30 85 L70 85 L75 35 L25 35" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M75 45 C90 45 90 65 75 65" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 20 C35 15 40 15 40 20 C40 25 35 25 35 20" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M48 18 C48 10 55 10 55 18 C55 26 48 26 48 18" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M60 20 C60 15 65 15 65 20 C65 25 60 25 60 20" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'scissors',
    name: 'Scissors',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="75" r="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="70" cy="75" r="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 65 L65 25" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M65 65 L35 25" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'glasses',
    name: 'Eyeglasses',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="70" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M48 50 L52 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 50 L5 45" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M88 50 L95 45" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'lightbulb',
    name: 'Light Bulb',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 55 C20 40 25 15 50 15 C75 15 80 40 65 55 L65 70 L35 70 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M38 75 L62 75" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 80 L60 80" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 85 L55 85" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'anchor',
    name: 'Anchor',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 28 L50 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 45 L70 45" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M20 75 C20 60 50 55 50 85 C50 55 80 60 80 75" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'crown',
    name: 'Crown',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 70 L15 40 L30 55 L50 30 L70 55 L85 40 L85 70 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="15" cy="38" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="28" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="85" cy="38" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'rocket',
    name: 'Rocket',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10 C60 25 60 55 55 70 L45 70 C40 55 40 25 50 10" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 70 L40 85 L50 78 L60 85 L55 70" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 45 C35 50 30 60 35 70 L45 60" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M55 45 C65 50 70 60 65 70 L55 60" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="40" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'fish',
    name: 'Fish',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M75 50 C75 30 45 20 25 35 L15 25 L15 75 L25 65 C45 80 75 70 75 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="60" cy="45" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 40 L40 60" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'flag',
    name: 'Flag',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 15 L25 90" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M25 20 L75 20 L65 35 L75 50 L25 50" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },

  // HARD - Objects with more detail
  {
    id: 'guitar',
    name: 'Guitar',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="70" rx="22" ry="25" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="70" rx="8" ry="10" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 45 L50 15" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 15 L55 15 L55 10 L45 10 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M47 15 L47 12" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 15 L50 12" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M53 15 L53 12" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'sailboat',
    name: 'Sailboat',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 75 L50 75 L50 85 L15 85 L25 80 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 75 L85 75 L75 85 L50 85 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 70 L50 20" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 25 L75 70 L50 70 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 20 L50 50 L30 50 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'camera',
    name: 'Camera',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="35" width="70" height="45" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="55" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="55" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 35 L40 25 L60 25 L65 35" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="75" cy="42" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'hourglass',
    name: 'Hourglass',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 15 L75 15" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M25 85 L75 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 15 L30 35 L50 50 L30 65 L30 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M70 15 L70 35 L50 50 L70 65 L70 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 75 L50 60 L65 75 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'cactus',
    name: 'Cactus in Pot',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 75 L25 90 L75 90 L70 75 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M42 75 L42 35 C42 25 58 25 58 35 L58 75" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M42 50 L35 50 C25 50 25 35 35 35 L35 45" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M58 45 L65 45 C75 45 75 55 65 55 L58 55" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'hotairballoon',
    name: 'Hot Air Balloon',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="35" rx="28" ry="30" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 55 L35 75 L65 75 L70 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="40" y="75" width="20" height="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 20 L35 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 10 L50 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M65 20 L65 55" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 C20 25 80 25 80 50 L75 55 L25 55 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 55 L38 85 L62 85 L60 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="40" cy="38" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="60" cy="40" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'snowman',
    name: 'Snowman',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="75" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="45" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="22" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="46" cy="20" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="54" cy="20" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M46 26 L54 26" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 12 L60 12 L55 8 L45 8 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'icecream',
    name: 'Ice Cream Cone',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 45 L50 90 L65 45" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M38 55 L62 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 65 L60 65" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="35" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 30 C40 25 45 30 50 25 C55 30 60 25 65 30" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'present',
    name: 'Gift Box',
    difficulty: 'easy',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="40" width="60" height="45" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="15" y="30" width="70" height="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 30 L50 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M20 55 L80 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 30 C40 25 35 15 45 15 C55 15 50 25 50 30" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 30 C60 25 65 15 55 15 C45 15 50 25 50 30" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },

  // NEW MEDIUM
  {
    id: 'boat',
    name: 'Boat',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 60 L25 80 L75 80 L85 60 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 60 L50 30" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 35 L70 55 L50 55 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'cup',
    name: 'Cup',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 30 L35 75 L65 75 L70 30 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M70 40 C85 40 85 60 70 60" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'bell',
    name: 'Bell',
    difficulty: 'medium',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 L50 25" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 70 C30 40 35 30 50 25 C65 30 70 40 70 70 L30 70" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M25 70 L75 70" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="80" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },

  // NEW HARD
  {
    id: 'castle',
    name: 'Castle',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 85 L20 50 L30 50 L30 40 L25 40 L25 30 L35 30 L35 40 L30 40 L30 50 L40 50 L40 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M60 85 L60 50 L70 50 L70 40 L65 40 L65 30 L75 30 L75 40 L70 40 L70 50 L80 50 L80 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M40 85 L40 60 L60 60 L60 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M45 85 L45 70 L55 70 L55 85" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'telescope',
    name: 'Telescope',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 35 L70 55 L70 65 L20 45 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M70 55 L85 50 L85 70 L70 65" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M35 50 L25 85" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 55 L60 85" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'turtle',
    name: 'Turtle',
    difficulty: 'hard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="55" rx="30" ry="20" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 40 C50 35 55 35 60 40" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 70 C50 75 55 75 60 70" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="25" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="22" cy="48" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M80 55 L88 55" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 70 L25 80" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M70 70 L75 80" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  }
];

export const getRandomDrawing = (
  usedIds: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' | 'all' = 'all'
): DrawingImage | null => {
  const available = drawings.filter(d =>
    !usedIds.includes(d.id) &&
    (difficulty === 'all' || d.difficulty === difficulty)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

export const getDrawingById = (id: string): DrawingImage | undefined => {
  return drawings.find(d => d.id === id);
};
