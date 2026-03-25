import { useRef, useEffect } from 'react';

export function useAudio(src: string, volume = 1.0) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio(src);
    audio.volume = volume;
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src, volume]);
  
  const play = () => {
    if (audioRef.current) {
      // Reset playback position if already played
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
    }
  };
  
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
  
  return { play, stop };
}