import React from 'react'; // Ensure React is imported if using JSX
import { Battle, Pokemon, Side } from "@pkmn/client";
import { Protocol } from "@pkmn/protocol";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Game } from './_components/Game';
import { AchievementService } from '@/services/api/smartrotom/achievementsService';

export const dynamic = 'force-dynamic';

const battle = new Battle(new Generations(Dex as any));

export default async function Test() {
  const replayData = (await AchievementService.getReplay("67d9b543-5ac9-41e1-a8a5-20d7689e24a4", 62)).data as any
  return (
    <section className="flex flex-col">
      <Game replayData={replayData} />
    </section>
  );
}
