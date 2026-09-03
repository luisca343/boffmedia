'use client';

import { useRef, KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { useVgcT } from "../../i18n";
import { Icon } from "@boffmedia/ui"
import { MatchNote } from '../../tracker-core/types';

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
  const t = useVgcT("tracker");
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
    <div className="flex min-h-0 flex-1 flex-col border border-solid border-line bg-panel">
      {/* Input row */}
      <div className="flex shrink-0 items-center gap-2 border-b border-solid border-line px-[0.875rem] py-[0.5625rem]">
        <span className="shrink-0 select-none font-mono text-[0.625rem] uppercase tracking-[0.1em] text-txt-dim">
          {phase === 'live' ? (
            <span className="flex items-center gap-[0.375rem] text-ok">
              <span className="inline-block h-[0.375rem] w-[0.375rem] rounded-full bg-ok animate-pulse motion-reduce:animate-none" />
              {t('indicators.live')}
            </span>
          ) : (
            <span className="text-signal">{t('indicators.post')}</span>
          )}
        </span>
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholders.addNote')}
          className="flex-1 bg-transparent font-body text-[0.8125rem] text-txt outline-none placeholder:text-txt-dim"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden select-none border border-solid border-line-2 px-1 py-px font-mono text-[0.625rem] text-txt-dim sm:inline">N</kbd>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="flex flex-1 flex-col gap-[0.5625rem] overflow-y-auto px-[0.875rem] py-[0.6875rem]">
          {[...notes].reverse().map((note) => (
            <div
              key={note.id}
              className="grid gap-[0.3125rem] border border-solid border-line border-l-[3px] bg-base px-[0.6875rem] py-[0.5625rem]"
              style={{ borderLeftColor: note.phase === 'live' ? 'var(--ok)' : note.phase === 'series' ? 'var(--warn)' : 'var(--info)' }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="justify-self-start px-[0.375rem] py-[3px] font-mono text-[0.53125rem] font-semibold uppercase leading-none tracking-[0.12em]"
                  style={
                    note.phase === 'live'
                      ? { color: 'var(--ok)', background: 'var(--ok-soft)' }
                      : note.phase === 'series'
                        ? { color: 'var(--warn)', background: 'var(--warn-soft)' }
                        : { color: 'var(--info)', background: 'var(--info-soft)' }
                  }
                >
                  {note.phase === 'live' ? t('notePhase.live') : note.phase === 'series' ? t('notePhase.series') : t('notePhase.post')}
                </span>
                <span className="font-mono text-[0.625rem] text-txt-dim">{formatTime(note.createdAt)}</span>
              </span>
              <p className="m-0 font-body text-[0.78125rem] leading-[1.55] text-txt-muted">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
