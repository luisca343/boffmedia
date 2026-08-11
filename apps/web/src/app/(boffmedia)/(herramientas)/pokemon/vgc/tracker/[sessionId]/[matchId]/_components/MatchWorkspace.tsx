'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Icon } from "@boffmedia/ui"
import { DkApp, DkBar, DkBody, DkBack, DkTitle, DkSpacer, cssVars } from '@/components/boffmedia/ui/tools/datakit';
import { usePokemonSearch } from '@/features/vgc-tracker/hooks/usePokemonSearch';
import { NotesPanel, NotesPanelHandle } from './NotesPanel';
import { TeamPanel } from './TeamPanel';
import { SpeedTierWidget } from './SpeedTierWidget';
import { TrSub, TR_OUTCOME_ORDER, TR_OUTCOME_TONE } from '../../../_components/ui/tr-ui';
import type { Match, MatchNote, MatchResult, MatchSlot, OutcomeTag } from '@/features/vgc-tracker/types';

interface Props {
  match: Match;
  sessionId: string;
  regulationId: string;
  onSave: (match: Match) => Promise<void>;
  onDelete: () => Promise<void>;
}

const HDR_INPUT = 'border border-solid border-line-2 bg-base font-body text-txt outline-none transition-[border-color] placeholder:text-txt-dim focus:border-accent';

export function MatchWorkspace({ match: initialMatch, sessionId, regulationId, onSave, onDelete }: Props) {
  const t = useTranslations('vgc.tracker');
  const router = useRouter();
  const { search } = usePokemonSearch(regulationId);
  const notesPanelRef = useRef<NotesPanelHandle>(null);

  const [match, setMatch] = useState<Match>(initialMatch);
  const [opponentNameInput, setOpponentNameInput] = useState(initialMatch.opponentName ?? '');
  const [archetypeInput, setArchetypeInput] = useState(initialMatch.opponentArchetype ?? '');
  const [eloAfterInput, setEloAfterInput] = useState(initialMatch.eloAfter !== undefined ? String(initialMatch.eloAfter) : '');
  const [opponentEloInput, setOpponentEloInput] = useState(initialMatch.opponentElo !== undefined ? String(initialMatch.opponentElo) : '');
  const [turnCountInput, setTurnCountInput] = useState(initialMatch.turnCount !== undefined ? String(initialMatch.turnCount) : '');
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

  const handleResult = (result: MatchResult) => {
    update({ result: result === match.result ? undefined : result });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (inInput || e.ctrlKey || e.metaKey) return;
      if (e.key === 'n') { e.preventDefault(); notesPanelRef.current?.focusInput(); }
      if (e.key === 'w') { e.preventDefault(); handleResult('win'); }
      if (e.key === 'l') { e.preventDefault(); handleResult('loss'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.result]);

  const handleOutcomeTag = (tag: OutcomeTag) => update({ outcomeTag: tag === match.outcomeTag ? undefined : tag });
  const handleMyTeamChange = (slots: MatchSlot[]) => update({ myTeam: { ...match.myTeam, slots } });
  const handleOpponentTeamChange = (slots: MatchSlot[]) => update({ opponentTeam: { ...match.opponentTeam, slots } });

  const handleAddNote = (text: string) => {
    const note: MatchNote = { id: crypto.randomUUID(), text, createdAt: Date.now(), phase: isCompleted ? 'post' : 'live' };
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
    if (saveTimer.current) { clearTimeout(saveTimer.current); onSave(match); }
    router.push(`/pokemon/vgc/tracker/${sessionId}`);
  };

  const handleDelete = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await onDelete();
    router.push(`/pokemon/vgc/tracker/${sessionId}`);
  };

  const time = new Date(match.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <DkApp>
      <DkBar>
        <DkBack onClick={handleBack} label={t('nav.backToSession')} />
        <DkTitle icon="sword" label={t('workspace.matchTitle')} sub={`${time} · ${match.format}`} />
        <DkSpacer />

        {/* Result toggle */}
        <div className="inline-flex gap-1">
          {(['win', 'draw', 'loss'] as MatchResult[]).map((r) => (
            <ResultButton key={r} result={r} active={match.result === r} onClick={() => handleResult(r)} label={t(`result.${r}Short`)} />
          ))}
        </div>

        {/* My ELO */}
        <label className="inline-flex items-center gap-[6px] border border-solid border-line-2 bg-panel px-[8px] py-[4px]">
          <span className="select-none font-mono text-[9px] uppercase tracking-[0.08em] text-txt-muted">{t('indicators.myElo')}</span>
          <input value={eloAfterInput} onChange={(e) => setEloAfterInput(e.target.value)} onBlur={() => update({ eloAfter: isNaN(parseFloat(eloAfterInput)) ? undefined : parseFloat(eloAfterInput) })} placeholder="—" className={cn(HDR_INPUT, 'w-16 border-0 bg-transparent text-center font-mono text-[15px]')} />
        </label>

        {/* Rival group */}
        <div className="inline-flex items-center gap-2 border border-solid border-line-2 bg-panel px-[8px] py-[4px]">
          <input value={opponentNameInput} onChange={(e) => setOpponentNameInput(e.target.value)} onBlur={() => update({ opponentName: opponentNameInput.trim() || undefined })} placeholder={t('placeholders.rivalName')} className={cn(HDR_INPUT, 'w-24 border-0 bg-transparent text-[13px]')} />
          <span className="text-txt-dim">·</span>
          <input value={archetypeInput} onChange={(e) => setArchetypeInput(e.target.value)} onBlur={() => update({ opponentArchetype: archetypeInput.trim() || undefined })} placeholder={t('archetype.placeholder')} className={cn(HDR_INPUT, 'w-20 border-0 bg-transparent text-[12px] text-txt-muted')} />
          <span className="text-txt-dim">·</span>
          <span className="select-none font-mono text-[9px] uppercase tracking-[0.08em] text-txt-muted">{t('indicators.rival')}</span>
          <input value={opponentEloInput} onChange={(e) => setOpponentEloInput(e.target.value)} onBlur={() => update({ opponentElo: isNaN(parseFloat(opponentEloInput)) ? undefined : parseFloat(opponentEloInput) })} placeholder="—" className={cn(HDR_INPUT, 'w-16 border-0 bg-transparent text-center font-mono text-[15px]')} />
        </div>

        {/* Finish / saved */}
        {!isCompleted ? (
          <button type="button" onClick={handleFinish} className="cut cut-edge-slant [--cut-line:var(--accent)] inline-flex items-center gap-[6px] border border-solid border-accent bg-accent px-3 py-[7px] font-display text-[13px] font-bold uppercase tracking-[0.06em] text-accent-ink transition-colors hover:bg-accent-bright">
            <Icon name="check" size={14} /> {t('buttons.finish')}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ok">
            <Icon name="check" size={13} /> {t('indicators.saved')}
          </span>
        )}

        {/* Delete */}
        {confirmDelete ? (
          <div className="inline-flex items-center gap-1">
            <button type="button" onClick={handleDelete} className="border border-solid border-bad bg-bad px-[10px] py-[6px] font-mono text-[11px] font-semibold uppercase text-white">
              {t('buttons.delete')}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="border border-solid border-line-2 bg-base px-[10px] py-[6px] font-mono text-[11px] text-txt-muted hover:text-txt">
              {t('buttons.cancel')}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} title={t('tooltips.deleteMatch')} className="grid h-8 w-8 place-items-center text-txt-dim transition-colors hover:text-bad">
            <Icon name="trash" size={15} />
          </button>
        )}
      </DkBar>

      <DkBody pad>
        <div className="grid grid-cols-1 items-start gap-[18px] min-[760px]:grid-cols-2 min-[1100px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)_minmax(280px,360px)]">
          <div className="grid gap-3 min-w-0">
            <TeamPanel label={t('labels.myTeam')} slots={match.myTeam.slots} editable={false} tone="var(--accent-bright)" onSlotChange={handleMyTeamChange} />
            <SpeedTierWidget slots={match.myTeam.slots} regulationId={regulationId} />
          </div>

          <div className="min-w-0 max-[1100px]:order-3 max-[1100px]:col-span-full">
            <NotesPanel ref={notesPanelRef} notes={match.notes} phase={isCompleted ? 'post' : 'live'} onAddNote={handleAddNote} />
          </div>

          <div className="grid gap-3 min-w-0">
            <TeamPanel label={t('labels.opponent')} slots={match.opponentTeam.slots} editable tone="var(--info)" search={search} onSlotChange={handleOpponentTeamChange} />
            <SpeedTierWidget slots={match.opponentTeam.slots} regulationId={regulationId} />

            <div className="border border-solid border-line bg-panel px-[14px] py-[12px]">
              <TrSub>{t('outcomeTag.label')}</TrSub>
              <div className="flex flex-wrap gap-[5px]">
                {TR_OUTCOME_ORDER.map((tag) => (
                  <OutcomeButton key={tag} tag={tag} active={match.outcomeTag === tag} onClick={() => handleOutcomeTag(tag)} label={t(`outcomeTag.${tag}`)} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border border-solid border-line bg-panel px-[14px] py-[12px]">
              <TrSub className="mb-0">{t('turnCount.label')}</TrSub>
              <input
                type="number"
                min={1}
                max={99}
                value={turnCountInput}
                onChange={(e) => setTurnCountInput(e.target.value)}
                onBlur={() => { const n = parseInt(turnCountInput, 10); update({ turnCount: isNaN(n) || n < 1 ? undefined : n }); }}
                placeholder="—"
                className={cn(HDR_INPUT, 'w-16 px-2 py-1 text-center font-mono text-[13px]')}
              />
            </div>
          </div>
        </div>
      </DkBody>
    </DkApp>
  );
}

function ResultButton({ result, active, onClick, label }: { result: MatchResult; active: boolean; onClick: () => void; label: string }) {
  const tone = result === 'win' ? 'var(--ok)' : result === 'loss' ? 'var(--bad)' : 'var(--warn)';
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? cssVars({ background: tone, borderColor: tone }) : undefined}
      className={cn(
        'border border-solid px-[14px] py-[6px] font-mono text-[13px] font-bold uppercase leading-none transition-all',
        active ? 'text-white' : 'border-line-2 bg-panel text-txt-muted hover:text-txt',
      )}
    >
      {label}
    </button>
  );
}

function OutcomeButton({ tag, active, onClick, label }: { tag: OutcomeTag; active: boolean; onClick: () => void; label: string }) {
  const tone = TR_OUTCOME_TONE[tag];
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? cssVars({ color: tone, borderColor: `color-mix(in srgb, ${tone} 55%, transparent)`, background: `color-mix(in srgb, ${tone} 11%, transparent)` }) : undefined}
      className={cn(
        'border border-solid px-[9px] py-[6px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.06em] transition-colors',
        !active && 'border-line-2 text-txt-dim hover:text-txt',
      )}
    >
      {label}
    </button>
  );
}
