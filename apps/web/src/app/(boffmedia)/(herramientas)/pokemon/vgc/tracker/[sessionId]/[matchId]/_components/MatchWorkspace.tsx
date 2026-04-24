'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePokemonSearch } from '@/features/vgc-tracker/hooks/usePokemonSearch';
import { NotesPanel, NotesPanelHandle } from './NotesPanel';
import { TeamPanel } from './TeamPanel';
import type { Match, MatchNote, MatchResult, MatchSlot } from '@/features/vgc-tracker/types';

interface Props {
  match: Match;
  sessionId: string;
  regulationId: string;
  onSave: (match: Match) => Promise<void>;
}

export function MatchWorkspace({ match: initialMatch, sessionId, regulationId, onSave }: Props) {
  const router = useRouter();
  const { search } = usePokemonSearch(regulationId);
  const notesPanelRef = useRef<NotesPanelHandle>(null);
  const eloRef = useRef<HTMLInputElement>(null);

  const [match, setMatch] = useState<Match>(initialMatch);
  const [eloInput, setEloInput] = useState(
    initialMatch.eloChange !== undefined ? String(initialMatch.eloChange) : '',
  );
  const [isCompleted, setIsCompleted] = useState(!!initialMatch.completedAt);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced auto-save: fires 600ms after the last change.
  const scheduleAutosave = useCallback(
    (updated: Match) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(updated), 600);
    },
    [onSave],
  );

  // Flush on unmount.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const update = useCallback(
    (patch: Partial<Match>) => {
      setMatch((prev) => {
        const next = { ...prev, ...patch };
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // N → focus notes (unless already in an input)
      if (e.key === 'n' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        notesPanelRef.current?.focusInput();
      }
      // W → win
      if (e.key === 'w' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleResult('win');
      }
      // L → loss
      if (e.key === 'l' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleResult('loss');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.result]);

  const handleResult = (result: MatchResult) => {
    const next = result === match.result ? undefined : result;
    update({ result: next });
  };

  const handleEloBlur = () => {
    const parsed = parseInt(eloInput, 10);
    update({ eloChange: isNaN(parsed) ? undefined : parsed });
  };

  const handleMyTeamChange = (slots: MatchSlot[]) => {
    update({ myTeam: { ...match.myTeam, slots } });
  };

  const handleOpponentTeamChange = (slots: MatchSlot[]) => {
    update({ opponentTeam: { ...match.opponentTeam, slots } });
  };

  const handleAddNote = (text: string) => {
    const note: MatchNote = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      phase: isCompleted ? 'post' : 'live',
    };
    update({ notes: [...match.notes, note] });
  };

  const handleFinish = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const finished = { ...match, completedAt: Date.now() };
    await onSave(finished);
    setMatch(finished);
    setIsCompleted(true);
  };

  const handleBack = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      onSave(match);
    }
    router.push(`/pokemon/vgc/tracker/${sessionId}`);
  };

  return (
    <div className="flex flex-col h-screen text-surface-50 overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 shrink-0 bg-surface-900">
        <button
          onClick={handleBack}
          className="text-surface-400 hover:text-surface-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-surface-400 text-sm">
            {new Date(match.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-surface-600 text-xs font-mono">{match.format}</span>
        </div>

        {/* Result buttons */}
        <div className="flex items-center gap-1.5">
          <ResultButton
            label="W"
            active={match.result === 'win'}
            color="green"
            onClick={() => handleResult('win')}
            hint="W"
          />
          <ResultButton
            label="L"
            active={match.result === 'loss'}
            color="red"
            onClick={() => handleResult('loss')}
            hint="L"
          />
        </div>

        {/* ELO */}
        <div className="flex items-center gap-1.5 bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5">
          <span className="text-xs text-surface-500 font-mono select-none">ELO</span>
          <input
            ref={eloRef}
            value={eloInput}
            onChange={(e) => setEloInput(e.target.value)}
            onBlur={handleEloBlur}
            placeholder="+0"
            className="w-14 bg-transparent text-surface-50 text-sm font-mono text-center focus:outline-none placeholder:text-surface-700"
          />
        </div>

        {/* Finish / save indicator */}
        {!isCompleted ? (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <Check size={14} /> Finish
          </button>
        ) : (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={13} /> Saved
          </span>
        )}
      </div>

      {/* ── Teams area ───────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-2 gap-4 px-4 py-4 overflow-hidden min-h-0">
        <div className="overflow-hidden">
          <TeamPanel
            label="My team"
            slots={match.myTeam.slots}
            editable={false}
            onSlotChange={handleMyTeamChange}
          />
        </div>
        <div className="overflow-hidden">
          <TeamPanel
            label="Opponent"
            slots={match.opponentTeam.slots}
            editable
            search={search}
            onSlotChange={handleOpponentTeamChange}
          />
        </div>
      </div>

      {/* ── Notes panel ──────────────────────────────────────────────────── */}
      <NotesPanel
        ref={notesPanelRef}
        notes={match.notes}
        phase={isCompleted ? 'post' : 'live'}
        onAddNote={handleAddNote}
      />
    </div>
  );
}

// ─── Result button ────────────────────────────────────────────────────────────

function ResultButton({
  label,
  active,
  color,
  onClick,
  hint,
}: {
  label: string;
  active: boolean;
  color: 'green' | 'red';
  onClick: () => void;
  hint: string;
}) {
  const base = 'relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all font-mono border';
  const styles = {
    green: active
      ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30'
      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-green-500/50 hover:text-green-300',
    red: active
      ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/30'
      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-red-500/50 hover:text-red-300',
  };

  return (
    <button onClick={onClick} className={`${base} ${styles[color]}`} title={`Press ${hint}`}>
      {label}
    </button>
  );
}
