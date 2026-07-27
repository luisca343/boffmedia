'use client';

import { useTranslations } from 'next-intl';
import { Protocol } from '@pkmn/protocol';

interface TeamPreviewProps {
  request: Protocol.Request;
  makeChoice: (choice: string) => void;
}

export function TeamPreview({ request, makeChoice }: TeamPreviewProps) {
  const t = useTranslations('battlesim');
  if (!request.side?.pokemon) return null;

  const pokemon = request.side.pokemon;

  return (
    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {t('choiceInput.teamPreview')}
      </div>
      <div className="flex flex-wrap gap-2">
        {pokemon.map((poke: { ident: string; details: string }, index: number) => {
          const name = poke.ident.split(': ')[1] || poke.ident;
          return (
            <div
              key={poke.ident}
              className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium"
            >
              {name}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => makeChoice('team 123456')}
        className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {t('choiceInput.confirmTeamOrder')}
      </button>
    </div>
  );
}
