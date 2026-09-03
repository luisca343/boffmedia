'use client';

import { Game } from '../components/replay/Game';
import { BsimScreenShell } from '../components/bsim-kit';
import { useToolT, BATTLESIM_NS } from '../i18n';

/** The paste-a-replay screen. Wrapped in the tool chrome so it has a way back:
 *  it used to render bare, which on the launcher means a one-way door. */
export function BsimReplayView() {
  const t = useToolT(BATTLESIM_NS);
  return (
    <BsimScreenShell>
      <Game />
    </BsimScreenShell>
  );
}
