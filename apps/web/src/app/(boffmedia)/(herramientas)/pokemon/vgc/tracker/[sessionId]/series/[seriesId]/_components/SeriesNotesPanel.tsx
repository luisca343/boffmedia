'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { MatchNote, SeriesGame } from '@/features/vgc-tracker/types';

interface Props {
  games: SeriesGame[];
  seriesNotes: MatchNote[];
  currentGameNumber: 1 | 2 | 3;
  isGameCompleted: boolean;
  isSeriesCompleted: boolean;
  onAddNote: (text: string) => void;
}

type FeedItem =
  | { kind: 'separator'; gameNumber: number }
  | { kind: 'note'; note: MatchNote; gameNumber?: number };

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function SeriesNotesPanel({ games, seriesNotes, isGameCompleted, isSeriesCompleted, onAddNote }: Props) {
  const t = useTranslations('vgc.tracker');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      onAddNote(input.trim());
      setInput('');
    }
  };

  const feed: FeedItem[] = [];
  const sortedGames = [...games].sort((a, b) => a.gameNumber - b.gameNumber);
  sortedGames.forEach((game, idx) => {
    if (idx > 0) feed.push({ kind: 'separator', gameNumber: game.gameNumber });
    [...game.notes].sort((a, b) => a.createdAt - b.createdAt).forEach((note) => feed.push({ kind: 'note', note, gameNumber: game.gameNumber }));
  });
  if (seriesNotes.length > 0) {
    if (sortedGames.length > 0) feed.push({ kind: 'separator', gameNumber: 0 });
    [...seriesNotes].sort((a, b) => a.createdAt - b.createdAt).forEach((note) => feed.push({ kind: 'note', note }));
  }

  const totalNotes = games.reduce((s, g) => s + g.notes.length, 0) + seriesNotes.length;

  return (
    <div className="flex h-full min-h-0 flex-col border border-solid border-line bg-panel">
      {/* Input row */}
      <div className="shrink-0 border-b border-solid border-line px-[14px] py-[10px]">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 font-mono text-[10px] uppercase tracking-[0.08em]',
              isSeriesCompleted ? 'text-txt-dim' : isGameCompleted ? 'text-warn' : 'text-ok',
            )}
          >
            {isSeriesCompleted ? `○ ${t('notes.phasePost')}` : isGameCompleted ? `◈ ${t('notes.phaseSeries')}` : `● ${t('notes.phaseLive')}`}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isSeriesCompleted}
            placeholder={t('placeholders.addNote')}
            className="flex-1 border-0 border-b border-solid border-line bg-transparent py-1 font-body text-[13px] text-txt outline-none transition-[border-color] placeholder:text-txt-dim focus:border-accent disabled:opacity-40"
          />
        </div>
      </div>

      {/* Feed */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-[14px] py-2">
        {totalNotes === 0 && <p className="py-6 text-center font-mono text-[11.5px] text-txt-dim">{t('notes.noGameNotes')}</p>}
        {feed.map((item, idx) => {
          if (item.kind === 'separator') {
            return (
              <div key={`sep-${idx}`} className="my-[2px] flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-line" />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
                  {item.gameNumber === 0 ? t('notes.phaseSeries') : t('workspace.game', { n: item.gameNumber })}
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>
            );
          }
          const isSeriesNote = item.gameNumber === undefined;
          return (
            <div key={item.note.id} className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-[5px] inline-block h-[6px] w-[6px] shrink-0 rounded-full',
                  item.note.phase === 'live' ? 'bg-ok' : isSeriesNote ? 'bg-warn' : 'bg-txt-dim',
                )}
              />
              <p className={cn('flex-1 font-body text-[13px] leading-snug', isSeriesNote ? 'text-warn' : 'text-txt')}>{item.note.text}</p>
              <span className="mt-[2px] shrink-0 font-mono text-[10px] text-txt-dim">{formatTime(item.note.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
