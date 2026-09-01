"use client"

import * as React from "react"
import { mewSfx } from "../mew-art"

interface AudioSource {
  opus: string
  m4a: string
}

const SFX_KEYS = ["hover", "select", "open", "close", "tab"] as const
type SfxKey = (typeof SFX_KEYS)[number]

/**
 * Master switch for every Mewgenics sound. Off by owner's decision — the codex
 * ships silent for now.
 *
 * It gates the hook AND the chrome's toggle button (MewChrome imports it), so
 * there is no control that promises audio it will never play. Flip this one
 * constant to bring the whole feature back; nothing else was removed. Typed
 * `boolean` rather than left as a literal so the guards below are not narrowed
 * to dead branches.
 */
export const MEW_SOUND_ENABLED: boolean = false

export function useMewSounds(enabled: boolean) {
  const poolRef = React.useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({})
  const loadedRef = React.useRef(false)

  const playSound = React.useCallback((key: string) => {
    if (!MEW_SOUND_ENABLED) return
    if (!SFX_KEYS.includes(key as SfxKey)) return
    if (!enabled) return

    if (!loadedRef.current) {
      loadedRef.current = true
    }

    const sfxKey = key as SfxKey
    const audio = poolRef.current[sfxKey]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {})
      return
    }

    const sfxData = mewSfx(sfxKey)
    if (!sfxData) return

    const newAudio = new Audio()
    poolRef.current[sfxKey] = newAudio

    const setupAudio = (src: string) => {
      newAudio.src = src
      newAudio.preload = "auto"
      newAudio.addEventListener("canplay", () => {
        newAudio.currentTime = 0
        newAudio.play().catch(() => {})
      }, { once: true })
      newAudio.load()
    }

    try {
      if (newAudio.canPlayType("audio/opus")) {
        setupAudio(sfxData.opus)
      } else if (newAudio.canPlayType("audio/mp4")) {
        setupAudio(sfxData.m4a)
      } else {
        setupAudio(sfxData.m4a)
      }
    } catch {
    }
  }, [enabled])

  return { playSound }
}
