import React from 'react';
import { Game } from '../_components/Game';

export default async function ReplayByNamePage({params}: {params: {name: string}}) {
  return (
    <section className="flex flex-col">
      <Game battleName={params.name} />
    </section>
  );
}
