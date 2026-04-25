'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchNote } from '@/features/vgc-tracker/types';

interface Props {
  gameNotes: MatchNote[];
  seriesNotes: MatchNote[];
  isGameCompleted: boolean;
  onAddGameNote: (text: string) => void;
  onAddSeriesNote: (text: string) => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function SeriesNotesPanel({
  gameNotes,
  seriesNotes,
  isGameCompleted,
  onAddGameNote,
  onAddSeriesNote,
}: Props) {
  const t = useTranslations('vgc.tracker');
  const [activeTab, setActiveTab] = useState<'game' | 'series'>('game');
  const [gameInput, setGameInput] = useState('');
  const [seriesInput, setSeriesInput] = useState('');
  const gameInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);

  const handleGameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameInput.trim()) {
      onAddGameNote(gameInput.trim());
      setGameInput('');
    }
  };

  const handleSeriesKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && seriesInput.trim()) {
      onAddSeriesNote(seriesInput.trim());
      setSeriesInput('');
    }
  };

  const allNotes = activeTab === 'game' ? [...gameNotes].reverse() : [...seriesNotes].reverse();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab switcher */}
      <div className="flex items-center gap-0.5 px-3 pt-3 pb-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'game'
              ? 'bg-surface-800 text-surface-50'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          {t('notes.gameTab')}
          {gameNotes.length > 0 && (
            <span className="ml-1.5 text-surface-600">{gameNotes.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'series'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          {t('notes.seriesTab')}
          {seriesNotes.length > 0 && (
            <span className="ml-1.5 text-surface-600">{seriesNotes.length}</span>
          )}
        </button>
      </div>

      {/* Input row */}
      <div className="shrink-0 px-3 pb-2 pt-1 border-b border-surface-800">
        {activeTab === 'game' ? (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono shrink-0 ${isGameCompleted ? 'text-surface-600' : 'text-red-400'}`}>
              {isGameCompleted ? `○ ${t('notes.phasePost')}` : `● ${t('notes.phaseLive')}`}
            </span>
            <input
              ref={gameInputRef}
              value={gameInput}
              onChange={(e) => setGameInput(e.target.value)}
              onKeyDown={handleGameKey}
              placeholder={t('placeholders.addNote')}
              className="flex-1 bg-transparent border-b border-surface-700 focus:border-primary-500 text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none py-1 transition-colors"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono shrink-0 text-amber-500">◈ {t('notes.phaseSeries')}</span>
            <input
              ref={seriesInputRef}
              value={seriesInput}
              onChange={(e) => setSeriesInput(e.target.value)}
              onKeyDown={handleSeriesKey}
              placeholder={t('notes.addSeriesPlaceholder')}
              className="flex-1 bg-transparent border-b border-surface-700 focus:border-amber-500 text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none py-1 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Notes list — newest first */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 min-h-0">
        {allNotes.length === 0 && (
          <p className="text-surface-700 text-xs text-center py-6">
            {activeTab === 'game' ? t('notes.noGameNotes') : t('notes.noSeriesNotes')}
          </p>
        )}
        {allNotes.map((note) => (
          <div key={note.id} className="flex gap-2 items-start">
            <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
              note.phase === 'live' ? 'bg-red-400' : note.phase === 'post' ? 'bg-surface-500' : 'bg-amber-400'
            }`} />
            <p className="text-surface-200 text-sm leading-snug flex-1">{note.text}</p>
            <span className="text-surface-600 text-[10px] shrink-0 mt-0.5">{formatTime(note.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
