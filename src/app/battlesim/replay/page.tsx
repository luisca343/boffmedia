import React from 'react'; // Ensure React is imported if using JSX
import { Battle, Pokemon, Side } from "@pkmn/client";
import { Protocol } from "@pkmn/protocol";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Game } from './_components/Game';

const battle = new Battle(new Generations(Dex as any)); // Use const if battle is not reassigned

export default function Test(): JSX.Element { // Explicitly type the return value

  return (
    <section className="flex flex-col">
      <Game/>
    </section>
  );
}
