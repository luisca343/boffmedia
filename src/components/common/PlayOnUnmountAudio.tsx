import { useEffect } from 'react'

interface PlayOnUnmountAudioProps {
  src: string
  volume?: number // Optional volume (0-1)
}

export default function PlayOnUnmountAudio({ src, volume = 1 }: PlayOnUnmountAudioProps) {
  useEffect(() => {
    return () => {
      const audio = new window.Audio(src)
      audio.volume = volume
      audio.play().catch(() => {}) // Ignore autoplay errors
    }
  }, [src, volume])
  return null
}
