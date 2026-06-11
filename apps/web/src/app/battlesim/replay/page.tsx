'use client';

import { Game } from './_components/Game';

/**
 * Replay hub: opens the paste loader. Saved replays live at /battlesim/replay/[id].
 * (Previously this page fetched a hardcoded replay id, which 404'd into a JSON parse error.)
 */
export default function ReplayPage() {
  return (
    <section className="flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Game />
    </section>
  );
}
