'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
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

export function SeriesNotesPanel({
  games,
  seriesNotes,
  currentGameNumber,
  isGameCompleted,
  isSeriesCompleted,
  onAddNote,
}: Props) {
  const t = useTranslations('vgc.tracker');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      onAddNote(input.trim());
      setInput('');
    }
  };

  // Build unified chronological feed with game separators
  const feed: FeedItem[] = [];
  const sortedGames = [...games].sort((a, b) => a.gameNumber - b.gameNumber);

  sortedGames.forEach((game, idx) => {
    if (idx > 0) {
      feed.push({ kind: 'separator', gameNumber: game.gameNumber });
    }
    const sorted = [...game.notes].sort((a, b) => a.createdAt - b.createdAt);
    sorted.forEach((note) => feed.push({ kind: 'note', note, gameNumber: game.gameNumber }));
  });

  // Append series notes inline after all games (amber-tinted)
  if (seriesNotes.length > 0) {
    if (sortedGames.length > 0) {
      feed.push({ kind: 'separator', gameNumber: 0 }); // 0 = series-level separator
    }
    [...seriesNotes]
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((note) => feed.push({ kind: 'note', note }));
  }

  const totalNotes = games.reduce((s, g) => s + g.notes.length, 0) + seriesNotes.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Input row */}
      <div className="shrink-0 px-3 py-2.5 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono shrink-0 ${
            isSeriesCompleted
              ? 'text-surface-600'
              : isGameCompleted
              ? 'text-amber-500'
              : 'text-red-400'
          }`}>
            {isSeriesCompleted
              ? `○ ${t('notes.phasePost')}`
              : isGameCompleted
              ? `◈ ${t('notes.phaseSeries')}`
              : `● ${t('notes.phaseLive')}`}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isSeriesCompleted}
            placeholder={t('placeholders.addNote')}
            className="flex-1 bg-transparent border-b border-surface-700 focus:border-primary-500 text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none py-1 transition-colors disabled:opacity-40"
          />
        </div>
      </div>

      {/* Unified feed */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 min-h-0">
        {totalNotes === 0 && (
          <p className="text-surface-700 text-xs text-center py-6">
            {t('notes.noGameNotes')}
          </p>
        )}
        {feed.map((item, idx) => {
          if (item.kind === 'separator') {
            return (
              <div key={`sep-${idx}`} className="flex items-center gap-2 py-1 my-0.5">
                <div className="flex-1 h-px bg-surface-800" />
                <span className="text-[10px] font-mono text-surface-600 shrink-0">
                  {item.gameNumber === 0
                    ? t('notes.phaseSeries')
                    : t('workspace.game', { n: item.gameNumber })}
                </span>
                <div className="flex-1 h-px bg-surface-800" />
              </div>
            );
          }
          const isSeriesNote = item.gameNumber === undefined;
          return (
            <div key={item.note.id} className="flex gap-2 items-start">
              <span className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${
                item.note.phase === 'live'
                  ? 'bg-red-400'
                  : isSeriesNote
                  ? 'bg-amber-400'
                  : 'bg-surface-500'
              }`} />
              <p className={`flex-1 text-sm leading-snug ${isSeriesNote ? 'text-amber-200/80' : 'text-surface-200'}`}>
                {item.note.text}
              </p>
              <span className="text-surface-600 text-[10px] shrink-0 mt-0.5">
                {formatTime(item.note.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
