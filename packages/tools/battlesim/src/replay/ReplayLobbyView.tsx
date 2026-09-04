'use client';

import { Game } from '../components/replay/Game';
import { BsimScreenShell } from '../components/bsim-kit';

/**
 * The paste-a-replay screen.
 *
 * The page chrome is on the LOADER only. Once a replay is pasted the player
 * takes the whole frame — the same bar/field/dock/rail shell a live battle
 * wears — and a padded page body around it would shrink the field back down.
 */
export function BsimReplayView() {
  return <Game shell={BsimScreenShell} />;
}
