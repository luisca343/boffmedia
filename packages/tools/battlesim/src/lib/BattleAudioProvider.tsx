'use client';

/**
 * Room-scoped audio context.
 *
 * Manages audio state per battle room: volume, mute, autoplay unlock.
 * Follows the same per-room pattern as BattleScaleProvider (see battle-layout.tsx):
 * room-specific state lives in context, global resources (the shared AudioContext,
 * current music playback) are singletons managed by BattleAudio.ts.
 *
 * Audio only plays when:
 * 1. The room is visible (checked via useRoomVisible)
 * 2. Autoplay is unlocked (user gesture has occurred)
 * 3. Audio is not muted
 *
 * On room unmount, stopMusic() is called but the audio context stays open
 * (it is shared across all battles).
 */

import * as React from 'react';
import { getPref, setPref } from '../storage';
import { useRoomVisible } from './room-visibility';
import {
  cleanupAudio,
  installAutoplayUnlock,
  isAudioUnlocked,
  onAudioUnlock,
  setMusicVolume,
  unlockAudioAutoplay,
  type BattleAudioState,
  type AudioVolume,
  DEFAULT_VOLUME,
} from '../engine/BattleAudio';

const STORAGE_KEY = 'audio.settings';

const BattleAudioCtx = React.createContext<BattleAudioState>({
  volume: DEFAULT_VOLUME,
  muted: false,
  autoplayUnlocked: false,
});

const BattleAudioSetterCtx = React.createContext<{
  setVolume: (channel: keyof AudioVolume, value: number) => void;
  setMuted: (muted: boolean) => void;
  unlockAutoplay: () => void;
  /** This room's token for owner-scoped module state — see `playMusic`. */
  owner: unknown;
} | null>(null);

export function useBattleAudioState(): BattleAudioState {
  return React.useContext(BattleAudioCtx);
}

export function useBattleAudioControls() {
  const ctx = React.useContext(BattleAudioSetterCtx);
  if (!ctx) {
    throw new Error('useBattleAudioControls must be used within BattleAudioProvider');
  }
  return ctx;
}

export interface BattleAudioProviderProps {
  children: React.ReactNode;
  roomId?: string;
}

/**
 * Provides per-room audio state and cleanup on unmount.
 *
 * Place this around each battle room (before any components that call
 * useBattleAudioState). The provider loads persisted settings on mount,
 * saves changes on every update, and cleans up the audio subsystem on unmount.
 */
export function BattleAudioProvider({ children, roomId }: BattleAudioProviderProps) {
  const visible = useRoomVisible();
  const [state, setState] = React.useState<BattleAudioState>({
    volume: DEFAULT_VOLUME,
    muted: false,
    autoplayUnlocked: false,
  });

  // Load persisted settings on mount
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await getPref<{ volume?: AudioVolume; muted?: boolean }>(STORAGE_KEY);
        if (isMounted && stored) {
          setState((prev) => ({
            ...prev,
            volume: stored.volume ?? prev.volume,
            muted: stored.muted ?? prev.muted,
          }));
        }
      } catch {
        // Fail silently; use defaults
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save settings whenever they change
  React.useEffect(() => {
    (async () => {
      try {
        await setPref(STORAGE_KEY, {
          volume: state.volume,
          muted: state.muted,
        });
      } catch {
        // Fail silently
      }
    })();
  }, [state.volume, state.muted]);

  /**
   * This room's identity for anything module-level that needs an owner (today,
   * the music). A ref, so it survives every re-render and is never equal to
   * another room's — `roomId` would be undefined for the embedded replay player
   * and two of those would then fight over the same track.
   */
  const owner = React.useRef({});

  /**
   * Arm the document-wide gesture unlock, and adopt it when it fires.
   *
   * Without this the tool stays silent until the audio button is pressed, which
   * is indistinguishable from the bug this feature fixes. Clicking a move or
   * pressing Play now unlocks it, and the state flips so the button shows what
   * is actually true.
   */
  React.useEffect(() => {
    if (isAudioUnlocked()) {
      setState((prev) => (prev.autoplayUnlocked ? prev : { ...prev, autoplayUnlocked: true }));
      return;
    }
    installAutoplayUnlock();
    return onAudioUnlock(() => setState((prev) => ({ ...prev, autoplayUnlocked: true })));
  }, []);

  // Volume and mute reach the PLAYING track without restarting it — a track
  // that jumped back to bar one every time you nudged the slider would be worse
  // than no slider.
  React.useEffect(() => {
    setMusicVolume(state);
  }, [state]);

  // Room teardown stops only this room's music (see BattleAudio's owner note);
  // the shared context stays open for whatever else is still on screen.
  React.useEffect(() => {
    const mine = owner.current;
    return () => {
      cleanupAudio(mine);
    };
  }, []);

  const setVolume = React.useCallback((channel: keyof AudioVolume, value: number) => {
    setState((prev) => ({
      ...prev,
      volume: { ...prev.volume, [channel]: value },
    }));
  }, []);

  const setMuted = React.useCallback((muted: boolean) => {
    setState((prev) => ({ ...prev, muted }));
  }, []);

  const unlockAutoplay = React.useCallback(async () => {
    if (!state.autoplayUnlocked) {
      await unlockAudioAutoplay();
      setState((prev) => ({ ...prev, autoplayUnlocked: true }));
    }
  }, [state.autoplayUnlocked]);

  const controlsValue = React.useMemo(
    () => ({ setVolume, setMuted, unlockAutoplay, owner: owner.current }),
    [setVolume, setMuted, unlockAutoplay]
  );

  return (
    <BattleAudioCtx.Provider value={state}>
      <BattleAudioSetterCtx.Provider value={controlsValue}>
        {children}
      </BattleAudioSetterCtx.Provider>
    </BattleAudioCtx.Provider>
  );
}
