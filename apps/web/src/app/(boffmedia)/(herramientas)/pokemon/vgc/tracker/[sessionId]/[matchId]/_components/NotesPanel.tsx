'use client';

import { useRef, KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { MatchNote } from '@/features/vgc-tracker/types';

interface Props {
  notes: MatchNote[];
  phase: 'live' | 'post';
  onAddNote: (text: string) => void;
}

export interface NotesPanelHandle {
  focusInput: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const NotesPanel = forwardRef<NotesPanelHandle, Props>(function NotesPanel(
  { notes, phase, onAddNote },
  ref,
) {
  const t = useTranslations('vgc.tracker');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current?.focus(),
  }));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const text = inputRef.current?.value.trim();
      if (text) {
        onAddNote(text);
        if (inputRef.current) inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-layer-1 flex flex-col">
      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-edge shrink-0">
        <span className="text-xs text-ink-muted font-mono shrink-0 select-none">
          {phase === 'live' ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              {t('indicators.live')}
            </span>
          ) : (
            <span className="text-ink-dim">{t('indicators.post')}</span>
          )}
        </span>
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholders.addNote')}
          className="flex-1 bg-transparent text-ink placeholder:text-ink-dim text-sm focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden sm:inline text-[10px] text-ink-dim border border-edge rounded px-1 py-0.5 font-mono select-none">
          N
        </kbd>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1.5">
          {[...notes].reverse().map((note) => (
            <div key={note.id} className="flex items-start gap-2 text-sm">
              <span
                className={`shrink-0 text-[10px] font-mono mt-0.5 ${
                  note.phase === 'live' ? 'text-red-400' : 'text-ink-muted'
                }`}
              >
                {note.phase === 'live' ? '●' : '○'} {formatTime(note.createdAt)}
              </span>
              <span className="text-ink leading-snug">{note.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
