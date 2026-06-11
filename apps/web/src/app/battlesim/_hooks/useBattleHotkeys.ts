'use client';

import { useEffect } from 'react';

interface UseBattleHotkeysOptions {
  moves: Array<{ onClick: () => void }>;
  switches: Array<{ onClick: () => void; disabled?: boolean }>;
  enabled?: boolean;
}

export function useBattleHotkeys({ moves, switches, enabled = true }: UseBattleHotkeysOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const key = e.key;

      // Move hotkeys: 1-4
      if (key >= '1' && key <= '4') {
        const idx = parseInt(key) - 1;
        if (idx < moves.length) {
          e.preventDefault();
          moves[idx].onClick();
        }
        return;
      }

      // Switch hotkeys: 5-9
      if (key >= '5' && key <= '9') {
        const idx = parseInt(key) - 5;
        if (idx < switches.length && !switches[idx].disabled) {
          e.preventDefault();
          switches[idx].onClick();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moves, switches, enabled]);
}
