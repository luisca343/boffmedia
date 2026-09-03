'use client';

import { useEffect } from 'react';

interface HotkeyAction {
  onClick: () => void;
  disabled?: boolean;
}

interface MechanicHotkey {
  key: string;
  toggle: () => void;
}

interface UseBattleHotkeysOptions {
  /** Move slots, mapped to keys 1-4. */
  moves: HotkeyAction[];
  /** Switch slots. Keys 5-9 (and 0 for the sixth) in move phase (offset 4), 1-6 in switch phase. */
  switches: HotkeyAction[];
  /** Key offset for switches: 4 when moves occupy 1-4, otherwise 0. */
  switchKeyOffset?: number;
  /** Mechanic toggles, e.g. { key: 't', toggle }. */
  mechanics?: MechanicHotkey[];
  /** Escape handler (leave target mode, disarm a mechanic, clear the last order). */
  onEscape?: () => void;
  enabled?: boolean;
}

export function useBattleHotkeys({
  moves,
  switches,
  switchKeyOffset = 4,
  mechanics = [],
  onEscape,
  enabled = true,
}: UseBattleHotkeysOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === 'escape' && onEscape) {
        onEscape();
        return;
      }

      const mech = mechanics.find((m) => m.key.toLowerCase() === key);
      if (mech) {
        e.preventDefault();
        mech.toggle();
        return;
      }

      // `0` is the tenth key: with moves on 1-4 it is the sixth bench slot. It
      // used to mean "whatever the last bench slot is", which on a bench of
      // three sent the third Pokémon while the chip said 7.
      const num = key === '0' ? 10 : key >= '1' && key <= '9' ? parseInt(key, 10) : NaN;
      if (Number.isNaN(num)) return;

      // Move keys occupy 1..moves.length
      if (moves.length > 0 && num <= moves.length) {
        const move = moves[num - 1];
        if (!move.disabled) {
          e.preventDefault();
          move.onClick();
        }
        return;
      }

      // Switch keys after the offset
      const idx = num - 1 - switchKeyOffset;
      if (idx >= 0 && idx < switches.length && !switches[idx].disabled) {
        e.preventDefault();
        switches[idx].onClick();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moves, switches, switchKeyOffset, mechanics, onEscape, enabled]);
}
