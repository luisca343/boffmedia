import React from 'react'; // Ensure React is imported if using JSX
import { Battle, Pokemon, Side } from "@pkmn/client";
import { Protocol } from "@pkmn/protocol";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Game } from './_components/Game';
import { achievementService } from '@/services/api/smartrotom/achievementsService';

const battle = new Battle(new Generations(Dex as any)); // Use const if battle is not reassigned

export default async function Test() { // Explicitly type the return value
  const replayData = (await achievementService.getReplay("67d9b543-5ac9-41e1-a8a5-20d7689e24a4", 62)).data as any
  return (
    <section className="flex flex-col">
      <Game replayData={replayData} />
    </section>
  );
}
