import React from 'react';
import { Game } from '../_components/Game';

export default function Test({params} : {params: {name: string}}): React.JSX.Element {

  return (
    <section className="flex flex-col">
      <Game battleName={params.name}/>
    </section>
  );
}
