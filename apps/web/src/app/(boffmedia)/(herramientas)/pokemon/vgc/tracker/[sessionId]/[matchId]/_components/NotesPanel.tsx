'use client';

import { useRef, KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from "@/components/boffmedia/primitives"
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
    <div className="flex min-h-0 flex-1 flex-col border border-solid border-line bg-panel">
      {/* Input row */}
      <div className="flex shrink-0 items-center gap-2 border-b border-solid border-line px-[14px] py-[9px]">
        <span className="shrink-0 select-none font-mono text-[10px] uppercase tracking-[0.1em] text-txt-dim">
          {phase === 'live' ? (
            <span className="flex items-center gap-[6px] text-ok">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-ok animate-pulse motion-reduce:animate-none" />
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
          className="flex-1 bg-transparent font-body text-[13px] text-txt outline-none placeholder:text-txt-dim"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden select-none border border-solid border-line-2 px-1 py-px font-mono text-[10px] text-txt-dim sm:inline">N</kbd>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="flex flex-1 flex-col gap-[9px] overflow-y-auto px-[14px] py-[11px]">
          {[...notes].reverse().map((note) => (
            <div
              key={note.id}
              className="grid gap-[5px] border border-solid border-line border-l-[3px] bg-base px-[11px] py-[9px]"
              style={{ borderLeftColor: note.phase === 'live' ? 'var(--ok)' : note.phase === 'series' ? 'var(--warn)' : 'var(--info)' }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="justify-self-start px-[6px] py-[3px] font-mono text-[8.5px] font-semibold uppercase leading-none tracking-[0.12em]"
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
                <span className="font-mono text-[10px] text-txt-dim">{formatTime(note.createdAt)}</span>
              </span>
              <p className="m-0 font-body text-[12.5px] leading-[1.55] text-txt-muted">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
