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

  const [match, setMatch] = useState<Match>(initialMatch);
  const [opponentNameInput, setOpponentNameInput] = useState(initialMatch.opponentName ?? '');
  const [eloAfterInput, setEloAfterInput] = useState(
    initialMatch.eloAfter !== undefined ? String(initialMatch.eloAfter) : '',
  );
  const [opponentEloInput, setOpponentEloInput] = useState(
    initialMatch.opponentElo !== undefined ? String(initialMatch.opponentElo) : '',
  );
  const [isCompleted, setIsCompleted] = useState(!!initialMatch.completedAt);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const scheduleAutosave = useCallback(
    (updated: Match) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(updated), 600);
    },
    [onSave],
  );

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'n' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        notesPanelRef.current?.focusInput();
      }
      if (e.key === 'w' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleResult('win');
      }
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

  const handleOpponentNameBlur = () => {
    update({ opponentName: opponentNameInput.trim() || undefined });
  };

  const handleEloAfterBlur = () => {
    const parsed = parseFloat(eloAfterInput);
    update({ eloAfter: isNaN(parsed) ? undefined : parsed });
  };

  const handleOpponentEloBlur = () => {
    const parsed = parseFloat(opponentEloInput);
    update({ opponentElo: isNaN(parsed) ? undefined : parsed });
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
    <div className="flex flex-col h-[calc(100vh-4rem)] text-surface-50 overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 shrink-0 bg-surface-900">
        <button
          onClick={handleBack}
          className="text-surface-400 hover:text-surface-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-surface-400 text-sm shrink-0">
            {new Date(match.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-surface-600 text-xs font-mono shrink-0">{match.format}</span>
          <input
            value={opponentNameInput}
            onChange={(e) => setOpponentNameInput(e.target.value)}
            onBlur={handleOpponentNameBlur}
            placeholder="Rival name…"
            className="min-w-0 flex-1 max-w-[160px] bg-transparent border-b border-surface-700 focus:border-primary-500 text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none py-0.5 transition-colors"
          />
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

        {/* ELO inputs */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5">
            <span className="text-[10px] text-surface-500 font-mono select-none uppercase">My ELO</span>
            <input
              value={eloAfterInput}
              onChange={(e) => setEloAfterInput(e.target.value)}
              onBlur={handleEloAfterBlur}
              placeholder="—"
              className="w-12 bg-transparent text-surface-50 text-sm font-mono text-center focus:outline-none placeholder:text-surface-700"
            />
          </div>
          <div className="flex items-center gap-1 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5">
            <span className="text-[10px] text-surface-500 font-mono select-none uppercase">Rival</span>
            <input
              value={opponentEloInput}
              onChange={(e) => setOpponentEloInput(e.target.value)}
              onBlur={handleOpponentEloBlur}
              placeholder="—"
              className="w-12 bg-transparent text-surface-50 text-sm font-mono text-center focus:outline-none placeholder:text-surface-700"
            />
          </div>
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
      <div className="flex-1 grid grid-cols-2 gap-4 px-8 py-4 min-h-0">
        <div className="overflow-y-auto">
          <TeamPanel
            label="My team"
            slots={match.myTeam.slots}
            editable={false}
            onSlotChange={handleMyTeamChange}
          />
        </div>
        <div className="overflow-visible">
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
