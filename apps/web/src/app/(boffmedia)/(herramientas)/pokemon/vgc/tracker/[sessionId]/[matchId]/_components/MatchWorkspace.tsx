'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePokemonSearch } from '@/features/vgc-tracker/hooks/usePokemonSearch';
import { NotesPanel, NotesPanelHandle } from './NotesPanel';
import { TeamPanel } from './TeamPanel';
import { SpeedTierWidget } from './SpeedTierWidget';
import type { Match, MatchNote, MatchResult, MatchSlot, OutcomeTag } from '@/features/vgc-tracker/types';

interface Props {
  match: Match;
  sessionId: string;
  regulationId: string;
  onSave: (match: Match) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function MatchWorkspace({ match: initialMatch, sessionId, regulationId, onSave, onDelete }: Props) {
  const t = useTranslations('vgc.tracker');
  const router = useRouter();
  const { search } = usePokemonSearch(regulationId);
  const notesPanelRef = useRef<NotesPanelHandle>(null);

  const [match, setMatch] = useState<Match>(initialMatch);
  const [opponentNameInput, setOpponentNameInput] = useState(initialMatch.opponentName ?? '');
  const [archetypeInput, setArchetypeInput] = useState(initialMatch.opponentArchetype ?? '');
  const [eloAfterInput, setEloAfterInput] = useState(
    initialMatch.eloAfter !== undefined ? String(initialMatch.eloAfter) : '',
  );
  const [opponentEloInput, setOpponentEloInput] = useState(
    initialMatch.opponentElo !== undefined ? String(initialMatch.opponentElo) : '',
  );
  const [turnCountInput, setTurnCountInput] = useState(
    initialMatch.turnCount !== undefined ? String(initialMatch.turnCount) : '',
  );
  const [isCompleted, setIsCompleted] = useState(!!initialMatch.completedAt);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const handleArchetypeBlur = () => {
    update({ opponentArchetype: archetypeInput.trim() || undefined });
  };

  const handleTurnCountBlur = () => {
    const n = parseInt(turnCountInput, 10);
    update({ turnCount: isNaN(n) || n < 1 ? undefined : n });
  };

  const handleOutcomeTag = (tag: OutcomeTag) => {
    update({ outcomeTag: tag === match.outcomeTag ? undefined : tag });
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

  const handleDelete = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await onDelete();
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

        {/* Time + format */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-surface-400 text-sm">
            {new Date(match.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-surface-600 text-xs font-mono">{match.format}</span>
        </div>

        <div className="flex-1" />

        {/* Result buttons */}
        <div className="flex items-center gap-1.5">
          <ResultButton
            label={t('result.winShort')}
            active={match.result === 'win'}
            color="green"
            onClick={() => handleResult('win')}
            hint="W"
          />
          <ResultButton
            label={t('result.drawShort')}
            active={match.result === 'draw'}
            color="yellow"
            onClick={() => handleResult('draw')}
            hint="D"
          />
          <ResultButton
            label={t('result.lossShort')}
            active={match.result === 'loss'}
            color="red"
            onClick={() => handleResult('loss')}
            hint="L"
          />
        </div>

        {/* My ELO — standalone (ELO after this match) */}
        <div className="flex items-center gap-1.5 bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] text-surface-500 font-mono select-none uppercase">{t('indicators.myElo')}</span>
          <input
            value={eloAfterInput}
            onChange={(e) => setEloAfterInput(e.target.value)}
            onBlur={handleEloAfterBlur}
            placeholder="—"
            className="w-20 bg-transparent text-surface-50 text-base font-mono text-center focus:outline-none placeholder:text-surface-700"
          />
        </div>

        {/* Rival group: name + archetype + rival ELO together */}
        <div className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5">
          <input
            value={opponentNameInput}
            onChange={(e) => setOpponentNameInput(e.target.value)}
            onBlur={handleOpponentNameBlur}
            placeholder={t('placeholders.rivalName')}
            className="w-24 bg-transparent text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none"
          />
          <span className="text-surface-700 text-xs shrink-0">·</span>
          <input
            value={archetypeInput}
            onChange={(e) => setArchetypeInput(e.target.value)}
            onBlur={handleArchetypeBlur}
            placeholder={t('archetype.placeholder')}
            className="w-20 bg-transparent text-surface-400 text-xs placeholder:text-surface-700 focus:outline-none"
          />
          <span className="text-surface-700 text-xs shrink-0">·</span>
          <span className="text-[10px] text-surface-500 font-mono select-none uppercase shrink-0">{t('indicators.rival')}</span>
          <input
            value={opponentEloInput}
            onChange={(e) => setOpponentEloInput(e.target.value)}
            onBlur={handleOpponentEloBlur}
            placeholder="—"
            className="w-20 bg-transparent text-surface-50 text-base font-mono text-center focus:outline-none placeholder:text-surface-700"
          />
        </div>

        {/* Finish / save indicator */}
        {!isCompleted ? (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <Check size={14} /> {t('buttons.finish')}
          </button>
        ) : (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={13} /> {t('indicators.saved')}
          </span>
        )}

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
            >
              {t('buttons.delete')}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-300 transition-colors"
            >
              {t('buttons.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-red-400 hover:bg-surface-800 transition-colors"
            title={t('tooltips.deleteMatch')}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* ── Main: My Team | Notes | Opponent ─────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* My Team column */}
        <div className="w-[400px] shrink-0 overflow-y-auto border-r border-surface-800 px-5 py-4">
          <TeamPanel
            label={t('labels.myTeam')}
            slots={match.myTeam.slots}
            editable={false}
            onSlotChange={handleMyTeamChange}
          />
          <SpeedTierWidget slots={match.myTeam.slots} />
        </div>

        {/* Notes — centre column fills remaining space */}
        <NotesPanel
          ref={notesPanelRef}
          notes={match.notes}
          phase={isCompleted ? 'post' : 'live'}
          onAddNote={handleAddNote}
        />

        {/* Opponent column */}
        <div className="w-[400px] shrink-0 overflow-y-auto border-l border-surface-800 px-5 py-4 flex flex-col gap-4">
          <TeamPanel
            label={t('labels.opponent')}
            slots={match.opponentTeam.slots}
            editable
            search={search}
            onSlotChange={handleOpponentTeamChange}
          />
          <SpeedTierWidget slots={match.opponentTeam.slots} />

          {/* Outcome tag */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">
              {t('outcomeTag.label')}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['skill', 'misplay', 'luck', 'disconnect'] as OutcomeTag[]).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleOutcomeTag(tag)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    match.outcomeTag === tag
                      ? tag === 'skill' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                        : tag === 'misplay' ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : tag === 'luck' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                        : 'bg-surface-500/20 border-surface-500/40 text-surface-300'
                      : 'border-surface-800 text-surface-500 hover:text-surface-300 hover:border-surface-700',
                  ].join(' ')}
                >
                  {t(`outcomeTag.${tag}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Turn count */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium shrink-0">
              {t('turnCount.label')}
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={turnCountInput}
              onChange={(e) => setTurnCountInput(e.target.value)}
              onBlur={handleTurnCountBlur}
              placeholder="—"
              className="w-16 bg-surface-800 border border-surface-700 focus:border-primary-500 rounded-lg text-surface-200 text-sm font-mono text-center focus:outline-none px-2 py-1 transition-colors placeholder:text-surface-600"
            />
          </div>
        </div>
      </div>

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
  color: 'green' | 'red' | 'yellow';
  onClick: () => void;
  hint: string;
}) {
  const t = useTranslations('vgc.tracker');
  const base = 'relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all font-mono border';
  const styles = {
    green: active
      ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30'
      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-green-500/50 hover:text-green-300',
    yellow: active
      ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-yellow-500/50 hover:text-yellow-300',
    red: active
      ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/30'
      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-red-500/50 hover:text-red-300',
  };

  return (
    <button onClick={onClick} className={`${base} ${styles[color]}`} title={t('tooltips.pressKey', { hint })}>
      {label}
    </button>
  );
}
