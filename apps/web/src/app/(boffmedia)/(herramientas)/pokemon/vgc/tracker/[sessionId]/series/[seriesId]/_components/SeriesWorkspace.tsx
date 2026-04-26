'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Lock, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePokemonSearch } from '@/features/vgc-tracker/hooks/usePokemonSearch';
import {
  computeSeriesResult,
  seriesScore,
  slotsForGame,
  emptySlots,
  spriteUrl,
  handleSpriteError,
  isLead,
} from '@/features/vgc-tracker/types';
import type {
  Series,
  SeriesGame,
  MatchNote,
  MatchResult,
  MatchSlot,
  OutcomeTag,
} from '@/features/vgc-tracker/types';
import { TeamPanel } from '../../../[matchId]/_components/TeamPanel';
import { SpeedTierWidget } from '../../../[matchId]/_components/SpeedTierWidget';
import { SeriesNotesPanel } from './SeriesNotesPanel';

interface Props {
  series: Series;
  sessionId: string;
  regulationId: string;
  onSave: (series: Series) => Promise<void>;
}

export function SeriesWorkspace({ series: initialSeries, sessionId, regulationId, onSave }: Props) {
  const t = useTranslations('vgc.tracker');
  const router = useRouter();
  const { search } = usePokemonSearch(regulationId);

  const [series, setSeries] = useState<Series>(initialSeries);
  const [activeGame, setActiveGame] = useState<1 | 2 | 3>(1);
  const [opponentNameInput, setOpponentNameInput] = useState(initialSeries.opponentName ?? '');
  const [roundInput, setRoundInput] = useState(
    initialSeries.roundNumber !== undefined ? String(initialSeries.roundNumber) : '',
  );
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
        const games = prev.games.map((g) =>
          g.gameNumber === gameNumber ? { ...g, ...patch } : g,
        );
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

  const handleOpponentNameBlur = () => {
    update({ opponentName: opponentNameInput.trim() || undefined });
  };

  const handleRoundBlur = () => {
    const n = parseInt(roundInput, 10);
    update({ roundNumber: isNaN(n) ? undefined : n });
  };

  const handleArchetypeBlur = () => {
    update({ opponentArchetype: archetypeInput.trim() || undefined });
  };

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
    const next = result === game.result ? undefined : result;
    updateGame(gameNumber, { result: next });
  };

  const handleMySlots = (gameNumber: 1 | 2 | 3, slots: MatchSlot[]) => {
    updateGame(gameNumber, { mySlots: slots });
  };

  const handleOpponentSlots = (gameNumber: 1 | 2 | 3, slots: MatchSlot[]) => {
    updateGame(gameNumber, { opponentSlots: slots });
  };

  const handleAddGameNote = (gameNumber: 1 | 2 | 3, text: string) => {
    const game = series.games.find((g) => g.gameNumber === gameNumber);
    if (!game) return;
    const note: MatchNote = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      phase: game.completedAt ? 'post' : 'live',
    };
    updateGame(gameNumber, { notes: [...game.notes, note] });
  };

  const handleAddSeriesNote = (text: string) => {
    const note: MatchNote = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      phase: 'series',
    };
    update({ notes: [...series.notes, note] });
  };

  // Unified note handler: adds to current game if ongoing, otherwise series-level
  const handleAddNote = (text: string) => {
    const game = series.games.find((g) => g.gameNumber === activeGame);
    if (game && !game.completedAt && !series.completedAt) {
      handleAddGameNote(activeGame, text);
    } else {
      handleAddSeriesNote(text);
    }
  };

  const handleFinishGame = (gameNumber: 1 | 2 | 3) => {
    updateGame(gameNumber, { completedAt: Date.now() });
    const { wins, losses } = seriesScore(
      series.games.map((g) => (g.gameNumber === gameNumber ? { ...g, completedAt: Date.now() } : g)),
    );
    // Unlock next game if series is still live
    const nextGame = gameNumber < 3 ? (gameNumber + 1) as 2 | 3 : null;
    if (nextGame && wins < 2 && losses < 2) {
      const currentGames = series.games;
      const alreadyExists = currentGames.some((g) => g.gameNumber === nextGame);
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
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      onSave(series);
    }
    router.push(`/pokemon/vgc/tracker/${sessionId}`);
  };

  const { wins, losses } = seriesScore(series.games);
  const currentGame = series.games.find((g) => g.gameNumber === activeGame);
  const game3Unlocked = series.games.some((g) => g.gameNumber === 3);

  return (
    <div className="flex flex-col h-screen text-surface-50 overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 shrink-0 bg-surface-900">
        <button onClick={handleBack} className="text-surface-400 hover:text-surface-50 transition-colors">
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Round input */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-surface-500 text-xs font-mono">{t('workspace.roundPrefix')}</span>
            <input
              value={roundInput}
              onChange={(e) => setRoundInput(e.target.value)}
              onBlur={handleRoundBlur}
              placeholder="—"
              className="w-8 bg-transparent text-surface-300 text-sm font-mono text-center focus:outline-none border-b border-surface-700 focus:border-amber-500 transition-colors"
            />
          </div>
          <span className="text-surface-700 text-xs">·</span>
          {/* Opponent name */}
          <input
            value={opponentNameInput}
            onChange={(e) => setOpponentNameInput(e.target.value)}
            onBlur={handleOpponentNameBlur}
            placeholder={t('placeholders.rivalName')}
            className="min-w-0 flex-1 max-w-[160px] bg-transparent border-b border-surface-700 focus:border-amber-500 text-surface-200 text-sm placeholder:text-surface-600 focus:outline-none py-0.5 transition-colors"
          />
          <span className="text-surface-700 text-xs">·</span>
          {/* Archetype */}
          <input
            value={archetypeInput}
            onChange={(e) => setArchetypeInput(e.target.value)}
            onBlur={handleArchetypeBlur}
            placeholder={t('archetype.placeholder')}
            className="min-w-0 flex-1 max-w-[120px] bg-transparent border-b border-surface-700 focus:border-amber-500 text-surface-400 text-xs placeholder:text-surface-700 focus:outline-none py-0.5 transition-colors"
          />
        </div>

        {/* Series score */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-2xl font-bold font-mono tabular-nums ${wins > losses ? 'text-green-400' : wins < losses ? 'text-red-400' : 'text-surface-300'}`}>
            {wins}
          </span>
          <span className="text-surface-600 text-sm">–</span>
          <span className={`text-2xl font-bold font-mono tabular-nums ${losses > wins ? 'text-red-400' : losses < wins ? 'text-green-400' : 'text-surface-300'}`}>
            {losses}
          </span>
        </div>

        {/* Finish */}
        {!isCompleted ? (
          <button
            onClick={handleFinishSeries}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            <Check size={14} /> {t('buttons.finish')}
          </button>
        ) : (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={13} /> {t('indicators.saved')}
          </span>
        )}
      </div>

      {/* ── Game tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-800 bg-surface-950 shrink-0">
        {([1, 2, 3] as const).map((n) => {
          const game = series.games.find((g) => g.gameNumber === n);
          const unlocked = !!game;
          const isActive = activeGame === n;
          const isDone = !!game?.completedAt;
          const isLocked = !unlocked;

          return (
            <button
              key={n}
              onClick={() => unlocked && setActiveGame(n)}
              disabled={isLocked}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isLocked
                  ? 'text-surface-700 cursor-not-allowed'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
              ].join(' ')}
            >
              {isLocked ? <Lock size={11} /> : isDone ? <Check size={11} className="text-green-400" /> : null}
              {t('workspace.game', { n })}
              {game?.result && (
                <span className={`text-[10px] font-mono ml-0.5 ${game.result === 'win' ? 'text-green-400' : game.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {game.result === 'win' ? t('result.winShort') : game.result === 'loss' ? t('result.lossShort') : t('result.drawShort')}
                </span>
              )}
            </button>
          );
        })}

        {/* Finish game button */}
        {currentGame && !currentGame.completedAt && series.seriesResult === undefined && (
          <button
            onClick={() => handleFinishGame(activeGame)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 text-xs transition-colors"
          >
            <Check size={11} /> {t('workspace.endGame', { n: activeGame })}
          </button>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {currentGame ? (
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">
          {/* Left: My team */}
          <div className="flex flex-col w-[360px] shrink-0 border-r border-surface-800 overflow-y-auto p-4 gap-4">
            <TeamPanel
              label={t('labels.myTeam')}
              slots={currentGame.mySlots}
              editable={false}
              onSlotChange={(slots) => handleMySlots(activeGame, slots)}
            />
            <SpeedTierWidget slots={currentGame.mySlots} />
            {activeGame > 1 && (
              <PreviousGameRecap games={series.games} upToGame={activeGame} side="my" />
            )}
          </div>

          {/* Center: Notes */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <SeriesNotesPanel
              games={series.games}
              seriesNotes={series.notes}
              currentGameNumber={activeGame}
              isGameCompleted={!!currentGame.completedAt}
              isSeriesCompleted={isCompleted}
              onAddNote={handleAddNote}
            />
          </div>

          {/* Right: Opponent */}
          <div className="flex flex-col w-[360px] shrink-0 border-l border-surface-800 overflow-visible p-4 gap-4">
            <TeamPanel
              label={t('labels.opponent')}
              slots={currentGame.opponentSlots}
              editable
              search={search}
              onSlotChange={(slots) => {
                handleOpponentSlots(activeGame, slots);
                // Propagate new species to series.opponentTeam for future games
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
              }}
            />
            <SpeedTierWidget slots={currentGame.opponentSlots} />
            {/* Result buttons for this game */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500 uppercase tracking-wide font-medium">{t('workspace.game', { n: activeGame })}</span>
              {(['win', 'loss', 'draw'] as MatchResult[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleGameResult(activeGame, r)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all',
                    currentGame.result === r
                      ? r === 'win' ? 'bg-green-500 border-green-400 text-white' : r === 'loss' ? 'bg-red-500 border-red-400 text-white' : 'bg-yellow-500 border-yellow-400 text-white'
                      : 'bg-surface-800 border-surface-700 text-surface-400 hover:text-surface-200',
                  ].join(' ')}
                >
                  {r === 'win' ? t('result.winShort') : r === 'loss' ? t('result.lossShort') : t('result.drawShort')}
                </button>
              ))}
            </div>

            {/* Outcome tag + turn count */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                {(['skill', 'misplay', 'luck', 'disconnect'] as OutcomeTag[]).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleGameOutcomeTag(activeGame, tag)}
                    className={[
                      'px-2 py-0.5 rounded text-[10px] font-medium border transition-all',
                      currentGame.outcomeTag === tag
                        ? tag === 'skill' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                          : tag === 'misplay' ? 'bg-red-500/20 border-red-500/40 text-red-300'
                          : tag === 'luck' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                          : 'bg-surface-500/20 border-surface-500/40 text-surface-300'
                        : 'border-surface-800 text-surface-600 hover:text-surface-400 hover:border-surface-700',
                    ].join(' ')}
                  >
                    {t(`outcomeTag.${tag}`)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium shrink-0">
                  {t('turnCount.label')}
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={currentGame.turnCount ?? ''}
                  onChange={(e) => handleGameTurnCount(activeGame, e.target.value)}
                  placeholder="—"
                  className="w-14 bg-transparent border-b border-surface-700 focus:border-amber-500 text-surface-300 text-xs font-mono text-center focus:outline-none transition-colors placeholder:text-surface-700"
                />
              </div>
            </div>
            {activeGame > 1 && (
              <PreviousGameRecap games={series.games} upToGame={activeGame} side="opponent" />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-surface-500 text-sm">
          {t('workspace.noGameData')}
        </div>
      )}
    </div>
  );
}

// ─── Previous game recap strip ────────────────────────────────────────────────

function PreviousGameRecap({
  games,
  upToGame,
  side,
}: {
  games: SeriesGame[];
  upToGame: number;
  side: 'my' | 'opponent';
}) {
  const t = useTranslations('vgc.tracker');
  const prior = games
    .filter((g) => g.gameNumber < upToGame)
    .sort((a, b) => a.gameNumber - b.gameNumber);

  if (!prior.length) return null;

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-surface-800">
      <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">{t('workspace.previousGames')}</span>
      {prior.map((g) => {
        const slots = side === 'my' ? g.mySlots : g.opponentSlots;
        const leads = slots.filter((s) => s.speciesId && isLead(s.role));
        const backs = slots.filter((s) => s.speciesId && (s.role === 'back1' || s.role === 'back2'));
        return (
          <div key={g.gameNumber} className="flex items-center gap-2">
            <span className={`text-[10px] font-bold font-mono w-4 ${g.result === 'win' ? 'text-green-400' : g.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>
              {g.result === 'win' ? t('result.winShort') : g.result === 'loss' ? t('result.lossShort') : t('result.drawShort')} {t('workspace.gameAbbr', { n: g.gameNumber })}
            </span>
            <div className="flex items-center gap-0.5">
              {leads.map((s) => (
                <img key={s.slotIndex} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="w-7 h-7 object-contain" onError={handleSpriteError} />
              ))}
            </div>
            {backs.length > 0 && (
              <>
                <span className="text-surface-700 text-[10px]">/</span>
                <div className="flex items-center gap-0.5">
                  {backs.map((s) => (
                    <img key={s.slotIndex} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="w-6 h-6 object-contain opacity-60" onError={handleSpriteError} />
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
