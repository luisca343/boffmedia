'use client';

import { Game } from '@/app/battlesim/replay/_components/Game';

export default function ReplayPage() {
  return (
    <section className="flex flex-col bg-base text-txt">
      <Game />
    </section>
  );
}
