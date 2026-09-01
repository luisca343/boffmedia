'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVgcNav } from "../../routing";
import { useVgcT } from "../../i18n";
import { cn } from '@boffmedia/ui/cn';
import { Icon } from "@boffmedia/ui"
import { DkApp, DkBar, DkBody, DkSub, DkBack, DkSpacer, cssVars } from '@boffmedia/ui/datakit';
import { usePokemonSearch } from '../../tracker-core/hooks/usePokemonSearch';
import {
  computeSeriesResult,
  seriesScore,
  slotsForGame,
  spriteUrl,
  handleSpriteError,
  isLead,
} from '../../tracker-core/types';
import type { Series, SeriesGame, MatchNote, MatchResult, MatchSlot, OutcomeTag } from '../../tracker-core/types';
import { TeamPanel } from '../match/TeamPanel';
import { SpeedTierWidget } from '../match/SpeedTierWidget';
import { SeriesNotesPanel } from './SeriesNotesPanel';
import { TrSub, TR_OUTCOME_ORDER, TR_OUTCOME_TONE, HDR_INPUT_UNDERLINE } from '../_components/ui/tr-ui';

interface Props {
  series: Series;
  sessionId: string;
  regulationId: string;
  onSave: (series: Series) => Promise<void>;
}

export function SeriesWorkspace({ series: initialSeries, sessionId, regulationId, onSave }: Props) {
  const t = useVgcT("tracker");
  const router = useVgcNav();
  const { search } = usePokemonSearch(regulationId);

  const [series, setSeries] = useState<Series>(initialSeries);
  const [activeGame, setActiveGame] = useState<1 | 2 | 3>(1);
  const [opponentNameInput, setOpponentNameInput] = useState(initialSeries.opponentName ?? '');
  const [roundInput, setRoundInput] = useState(initialSeries.roundNumber !== undefined ? String(initialSeries.roundNumber) : '');
  const [archetypeInput, setArchetypeInput] = useState(initialSeries.opponentArchetype ?? '');
  const [isCompleted, setIsCompleted] = useState(!!initialSeries.completedAt);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const scheduleAutosave = useCallback(
    (updated: Series) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(updated), 600);
    },
    [onSave],
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const update = useCallback(
    (patch: Partial<Series>) => {
      setSeries((prev) => {
        const next = { ...prev, ...patch };
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  const updateGame = useCallback(
    (gameNumber: 1 | 2 | 3, patch: Partial<SeriesGame>) => {
      setSeries((prev) => {
        const games = prev.games.map((g) => (g.gameNumber === gameNumber ? { ...g, ...patch } : g));
        const updatedResult = computeSeriesResult(games);
        const next: Series = {
          ...prev,
          games,
          seriesResult: updatedResult,
          completedAt: updatedResult && !prev.completedAt ? Date.now() : prev.completedAt,
        };
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  const handleGameOutcomeTag = (gameNumber: 1 | 2 | 3, tag: OutcomeTag) => {
    const game = series.games.find((g) => g.gameNumber === gameNumber);
    if (!game) return;
    updateGame(gameNumber, { outcomeTag: tag === game.outcomeTag ? undefined : tag });
  };

  const handleGameTurnCount = (gameNumber: 1 | 2 | 3, value: string) => {
    const n = parseInt(value, 10);
    updateGame(gameNumber, { turnCount: isNaN(n) || n < 1 ? undefined : n });
  };

  const handleGameResult = (gameNumber: 1 | 2 | 3, result: MatchResult) => {
    const game = series.games.find((g) => g.gameNumber === gameNumber);
    if (!game) return;
    updateGame(gameNumber, { result: result === game.result ? undefined : result });
  };

  const handleMySlots = (gameNumber: 1 | 2 | 3, slots: MatchSlot[]) => updateGame(gameNumber, { mySlots: slots });

  const handleOpponentSlots = (gameNumber: 1 | 2 | 3, slots: MatchSlot[]) => {
    updateGame(gameNumber, { opponentSlots: slots });
    setSeries((prev) => {
      const merged = prev.opponentTeam.slots.map((s) => {
        const updated = slots.find((u) => u.slotIndex === s.slotIndex);
        if (updated?.speciesId && !s.speciesId) return { ...updated, role: 'unknown' as const };
        return s;
      });
      const next = { ...prev, opponentTeam: { ...prev.opponentTeam, slots: merged } };
      scheduleAutosave(next);
      return next;
    });
  };

  const handleAddGameNote = (gameNumber: 1 | 2 | 3, text: string) => {
    const game = series.games.find((g) => g.gameNumber === gameNumber);
    if (!game) return;
    const note: MatchNote = { id: crypto.randomUUID(), text, createdAt: Date.now(), phase: game.completedAt ? 'post' : 'live' };
    updateGame(gameNumber, { notes: [...game.notes, note] });
  };

  const handleAddSeriesNote = (text: string) => {
    const note: MatchNote = { id: crypto.randomUUID(), text, createdAt: Date.now(), phase: 'series' };
    update({ notes: [...series.notes, note] });
  };

  const handleAddNote = (text: string) => {
    const game = series.games.find((g) => g.gameNumber === activeGame);
    if (game && !game.completedAt && !series.completedAt) handleAddGameNote(activeGame, text);
    else handleAddSeriesNote(text);
  };

  const handleFinishGame = (gameNumber: 1 | 2 | 3) => {
    updateGame(gameNumber, { completedAt: Date.now() });
    const { wins, losses } = seriesScore(series.games.map((g) => (g.gameNumber === gameNumber ? { ...g, completedAt: Date.now() } : g)));
    const nextGame = gameNumber < 3 ? ((gameNumber + 1) as 2 | 3) : null;
    if (nextGame && wins < 2 && losses < 2) {
      const alreadyExists = series.games.some((g) => g.gameNumber === nextGame);
      if (!alreadyExists) {
        const newGame: SeriesGame = {
          id: crypto.randomUUID(),
          gameNumber: nextGame,
          mySlots: slotsForGame(series.myTeam.slots),
          opponentSlots: slotsForGame(series.opponentTeam.slots),
          notes: [],
        };
        setSeries((prev) => {
          const next = { ...prev, games: [...prev.games, newGame] };
          scheduleAutosave(next);
          return next;
        });
        setActiveGame(nextGame);
      }
    }
  };

  const handleFinishSeries = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const finished: Series = { ...series, completedAt: series.completedAt ?? Date.now() };
    await onSave(finished);
    setSeries(finished);
    setIsCompleted(true);
  };

  const handleBack = () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); onSave(series); }
    router.push(`/pokemon/vgc/tracker/${sessionId}`);
  };

  const { wins, losses } = seriesScore(series.games);
  const currentGame = series.games.find((g) => g.gameNumber === activeGame);

  return (
    <DkApp>
      <DkBar>
        <DkBack onClick={handleBack} label={t('nav.backToSession')} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-[11px] text-txt-muted">{t('workspace.roundPrefix')}</span>
            <input value={roundInput} onChange={(e) => setRoundInput(e.target.value)} onBlur={() => { const n = parseInt(roundInput, 10); update({ roundNumber: isNaN(n) ? undefined : n }); }} placeholder="—" className={cn(HDR_INPUT_UNDERLINE, 'w-8 text-center font-mono text-[13px]')} />
          </span>
          <span className="text-txt-dim">·</span>
          <input value={opponentNameInput} onChange={(e) => setOpponentNameInput(e.target.value)} onBlur={() => update({ opponentName: opponentNameInput.trim() || undefined })} placeholder={t('placeholders.rivalName')} className={cn(HDR_INPUT_UNDERLINE, 'min-w-0 max-w-[160px] flex-1 py-[2px] text-[13px]')} />
          <span className="text-txt-dim">·</span>
          <input value={archetypeInput} onChange={(e) => setArchetypeInput(e.target.value)} onBlur={() => update({ opponentArchetype: archetypeInput.trim() || undefined })} placeholder={t('archetype.placeholder')} className={cn(HDR_INPUT_UNDERLINE, 'min-w-0 max-w-[120px] flex-1 py-[2px] text-[12px] text-txt-muted')} />
        </div>
        <DkSpacer />
        <span className="inline-flex items-center gap-[6px]">
          <span className={cn('font-mono text-[24px] font-bold tabular-nums leading-none', wins > losses ? 'text-ok' : wins < losses ? 'text-bad' : 'text-txt')}>{wins}</span>
          <span className="text-[14px] text-txt-dim">–</span>
          <span className={cn('font-mono text-[24px] font-bold tabular-nums leading-none', losses > wins ? 'text-bad' : losses < wins ? 'text-ok' : 'text-txt')}>{losses}</span>
        </span>
        {!isCompleted ? (
          <button type="button" onClick={handleFinishSeries} className="cut cut-edge-slant [--cut-line:var(--accent)] inline-flex items-center gap-[6px] border border-solid border-accent bg-accent px-3 py-[7px] font-display text-[13px] font-bold uppercase tracking-[0.06em] text-accent-ink transition-colors hover:bg-accent-bright">
            <Icon name="check" size={14} /> {t('buttons.finish')}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ok">
            <Icon name="check" size={13} /> {t('indicators.saved')}
          </span>
        )}
      </DkBar>

      {/* Game tabs */}
      <DkSub>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([1, 2, 3] as const).map((n) => {
            const game = series.games.find((g) => g.gameNumber === n);
            const unlocked = !!game;
            const active = activeGame === n;
            const done = !!game?.completedAt;
            return (
              <button
                key={n}
                type="button"
                onClick={() => unlocked && setActiveGame(n)}
                disabled={!unlocked}
                className={cn('cut-tag cut-tag-edge [--cut-tag:6px] ', 'inline-flex flex-none items-center gap-[6px] border border-solid px-[10px] py-[7px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.08em] transition-[color,background,border-color]',
                  active ? 'border-accent bg-accent text-accent-ink' : !unlocked ? 'cursor-not-allowed border-line bg-base text-txt-dim' : 'border-line bg-base text-txt-muted hover:text-txt',
                )}
              >
                {!unlocked ? <Icon name="lock" size={11} /> : done ? <Icon name="check" size={11} className={active ? '' : 'text-ok'} /> : null}
                {t('workspace.game', { n })}
                {game?.result && (
                  <span className={cn('font-mono text-[10px]', active ? '' : game.result === 'win' ? 'text-ok' : game.result === 'loss' ? 'text-bad' : 'text-warn')}>
                    {t(`result.${game.result}Short`)}
                  </span>
                )}
              </button>
            );
          })}
          {currentGame && !currentGame.completedAt && series.seriesResult === undefined && (
            <button type="button" onClick={() => handleFinishGame(activeGame)} className="ml-auto inline-flex flex-none items-center gap-1 border border-solid border-line-2 bg-base px-[10px] py-[6px] font-mono text-[10px] uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt">
              <Icon name="check" size={11} /> {t('workspace.endGame', { n: activeGame })}
            </button>
          )}
        </div>
      </DkSub>

      <DkBody pad>
        {currentGame ? (
          <div className="grid grid-cols-1 items-start gap-[18px] min-[760px]:grid-cols-2 min-[1100px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)_minmax(280px,360px)]">
            <div className="grid min-w-0 gap-3">
              <TeamPanel label={t('labels.myTeam')} slots={currentGame.mySlots} editable={false} tone="var(--accent-bright)" onSlotChange={(slots) => handleMySlots(activeGame, slots)} />
              <SpeedTierWidget slots={currentGame.mySlots} regulationId={regulationId} />
              {activeGame > 1 && <PreviousGameRecap games={series.games} upToGame={activeGame} side="my" />}
            </div>

            <div className="min-w-0 max-[1100px]:order-3 max-[1100px]:col-span-full min-[1100px]:h-[70vh]">
              <SeriesNotesPanel
                games={series.games}
                seriesNotes={series.notes}
                currentGameNumber={activeGame}
                isGameCompleted={!!currentGame.completedAt}
                isSeriesCompleted={isCompleted}
                onAddNote={handleAddNote}
              />
            </div>

            <div className="grid min-w-0 gap-3">
              <TeamPanel label={t('labels.opponent')} slots={currentGame.opponentSlots} editable tone="var(--info)" search={search} onSlotChange={(slots) => handleOpponentSlots(activeGame, slots)} />
              <SpeedTierWidget slots={currentGame.opponentSlots} regulationId={regulationId} />

              <div className="border border-solid border-line bg-panel px-[14px] py-[12px]">
                <TrSub>{t('workspace.game', { n: activeGame })}</TrSub>
                <div className="flex gap-2">
                  {(['win', 'loss', 'draw'] as MatchResult[]).map((r) => (
                    <GameResultButton key={r} result={r} active={currentGame.result === r} onClick={() => handleGameResult(activeGame, r)} label={t(`result.${r}Short`)} />
                  ))}
                </div>
              </div>

              <div className="border border-solid border-line bg-panel px-[14px] py-[12px]">
                <TrSub>{t('outcomeTag.label')}</TrSub>
                <div className="mb-3 flex flex-wrap gap-[5px]">
                  {TR_OUTCOME_ORDER.map((tag) => (
                    <OutcomeButton key={tag} tag={tag} active={currentGame.outcomeTag === tag} onClick={() => handleGameOutcomeTag(activeGame, tag)} label={t(`outcomeTag.${tag}`)} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <TrSub className="mb-0">{t('turnCount.label')}</TrSub>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={currentGame.turnCount ?? ''}
                    onChange={(e) => handleGameTurnCount(activeGame, e.target.value)}
                    placeholder="—"
                    className="w-16 border border-solid border-line-2 bg-base px-2 py-1 text-center font-mono text-[13px] text-txt outline-none focus:border-accent"
                  />
                </div>
              </div>
              {activeGame > 1 && <PreviousGameRecap games={series.games} upToGame={activeGame} side="opponent" />}
            </div>
          </div>
        ) : (
          <div className="grid place-items-center py-16 font-mono text-[13px] text-txt-muted">{t('workspace.noGameData')}</div>
        )}
      </DkBody>
    </DkApp>
  );
}

function GameResultButton({ result, active, onClick, label }: { result: MatchResult; active: boolean; onClick: () => void; label: string }) {
  const tone = result === 'win' ? 'var(--ok)' : result === 'loss' ? 'var(--bad)' : 'var(--warn)';
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? cssVars({ background: tone, borderColor: tone }) : undefined}
      className={cn('flex-1 border border-solid py-[6px] font-mono text-[12px] font-bold uppercase leading-none transition-all', active ? 'text-white' : 'border-line-2 bg-base text-txt-muted hover:text-txt')}
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
      className={cn('border border-solid px-[9px] py-[6px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.06em] transition-colors', !active && 'border-line-2 text-txt-dim hover:text-txt')}
    >
      {label}
    </button>
  );
}

function PreviousGameRecap({ games, upToGame, side }: { games: SeriesGame[]; upToGame: number; side: 'my' | 'opponent' }) {
  const t = useVgcT("tracker");
  const prior = games.filter((g) => g.gameNumber < upToGame).sort((a, b) => a.gameNumber - b.gameNumber);
  if (!prior.length) return null;

  return (
    <div className="grid gap-2 border-t border-solid border-line pt-2">
      <TrSub>{t('workspace.previousGames')}</TrSub>
      {prior.map((g) => {
        const slots = side === 'my' ? g.mySlots : g.opponentSlots;
        const leads = slots.filter((s) => s.speciesId && isLead(s.role));
        const backs = slots.filter((s) => s.speciesId && (s.role === 'back1' || s.role === 'back2'));
        const resTone = g.result === 'win' ? 'text-ok' : g.result === 'loss' ? 'text-bad' : 'text-warn';
        return (
          <div key={g.gameNumber} className="flex items-center gap-2">
            <span className={cn('w-9 shrink-0 font-mono text-[10px] font-bold uppercase', resTone)}>
              {g.result ? t(`result.${g.result}Short`) : '—'} {t('workspace.gameAbbr', { n: g.gameNumber })}
            </span>
            <div className="flex items-center gap-[2px]">
              {leads.map((s) => (
                <img key={s.slotIndex} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="h-7 w-7 object-contain" onError={handleSpriteError} />
              ))}
            </div>
            {backs.length > 0 && (
              <>
                <span className="text-[10px] text-txt-dim">/</span>
                <div className="flex items-center gap-[2px]">
                  {backs.map((s) => (
                    <img key={s.slotIndex} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="h-6 w-6 object-contain opacity-60" onError={handleSpriteError} />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
