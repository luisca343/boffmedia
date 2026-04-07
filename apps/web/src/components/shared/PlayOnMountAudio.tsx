import { useEffect } from 'react'

interface PlayOnMountAudioProps {
  src: string
  volume?: number // Optional volume (0-1)
}

export default function PlayOnMountAudio({ src, volume = 1 }: PlayOnMountAudioProps) {
  useEffect(() => {
    const audio = new window.Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [src, volume])
  return null
}
