import { useCallback, useRef, useEffect } from 'react';

type SoundName = 'curtain' | 'drumroll' | 'ding' | 'whoosh' | 'celebration' | 'fanfare';

const SOUND_PATHS: Record<SoundName, string> = {
  curtain: '/sounds/curtain.mp3',
  drumroll: '/sounds/drumroll.mp3',
  ding: '/sounds/ding.mp3',
  whoosh: '/sounds/whoosh.mp3',
  celebration: '/sounds/celebration.mp3',
  fanfare: '/sounds/fanfare.mp3',
};

interface UseSoundEffectsOptions {
  enabled?: boolean;
  volume?: number;
}

export const useSoundEffects = (options: UseSoundEffectsOptions = {}) => {
  const { enabled = true, volume = 0.5 } = options;
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const loadAttempted = useRef<Set<SoundName>>(new Set());

  // Preload sounds on mount
  useEffect(() => {
    if (!enabled) return;

    Object.entries(SOUND_PATHS).forEach(([name, path]) => {
      const soundName = name as SoundName;
      if (loadAttempted.current.has(soundName)) return;

      loadAttempted.current.add(soundName);
      const audio = new Audio(path);
      audio.volume = volume;
      audio.preload = 'auto';

      // Only cache if it loads successfully
      audio.addEventListener('canplaythrough', () => {
        audioCache.current.set(soundName, audio);
      }, { once: true });

      // Silently ignore load errors (sounds are optional)
      audio.addEventListener('error', () => {
        console.debug(`Sound effect not found: ${path} (this is optional)`);
      }, { once: true });
    });
  }, [enabled, volume]);

  const play = useCallback((name: SoundName) => {
    if (!enabled) return;

    const audio = audioCache.current.get(name);
    if (audio) {
      // Clone the audio to allow overlapping plays
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }, [enabled, volume]);

  const playDrumroll = useCallback(() => {
    if (!enabled) return null;

    const audio = audioCache.current.get('drumroll');
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.loop = true;
      clone.play().catch(() => {});
      return () => {
        clone.pause();
        clone.currentTime = 0;
      };
    }
    return null;
  }, [enabled, volume]);

  return {
    play,
    playDrumroll,
    playCurtain: useCallback(() => play('curtain'), [play]),
    playDing: useCallback(() => play('ding'), [play]),
    playWhoosh: useCallback(() => play('whoosh'), [play]),
    playCelebration: useCallback(() => play('celebration'), [play]),
    playFanfare: useCallback(() => play('fanfare'), [play]),
  };
};
