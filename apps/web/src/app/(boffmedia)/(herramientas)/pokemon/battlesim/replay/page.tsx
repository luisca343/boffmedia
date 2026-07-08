'use client';

import { Game } from '@/app/battlesim/replay/_components/Game';

export default function ReplayPage() {
  return (
    <section data-ds="boffmedia" className="flex flex-col bg-base text-txt">
      <Game />
    </section>
  );
}
