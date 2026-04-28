'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Layers, Plus, Swords, Trophy, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMatches, usePresets, useSeries, useSessions, usePreset } from '@/features/vgc-tracker/hooks/useVgcDb';
import { emptySlots, seriesScore, slotsForGame, slotsFromPreset, spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { parseMatchCsv } from '@/features/vgc-tracker/utils/importCsv';
import { vgcDb } from '@/lib/db/vgc-db';
import type { Match, Series, SeriesGame } from '@/features/vgc-tracker/types';
import { useTrackerSync } from '@/features/vgc-tracker/context/TrackerSyncContext';
import { SessionStatsView } from './_components/SessionStatsView';
import { ExportImportDialog } from '../_components/ExportImportDialog';

interface Props {
  params: Promise<{ sessionId: string }>;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function SessionPage({ params }: Props) {
  const t = useTranslations('vgc.tracker');
  const tStats = useTranslations('vgc.tracker.sessionStats');
  const { sessionId } = use(params);
  const router = useRouter();
  const { sessions, update: updateSession } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);
  const { matches, loading, create: createMatch, refresh: refreshMatches } = useMatches(sessionId);
  const { seriesList, loading: seriesLoading, create: createSeries } = useSeries(sessionId);
  const { pushChange } = useTrackerSync();
  const { presets } = usePresets();
  const preset = usePreset(session?.activePresetId ?? null);
  const isTournament = session?.type === 'tournament';

  // Presets for this session's regulation
  const sessionPresets = presets.filter((p) => p.regulationId === session?.regulationId);

  const [activeTab, setActiveTab] = useState<'matches' | 'stats'>('matches');
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [roundFilter, setRoundFilter] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importConfig, setImportConfig] = useState<{ file: File } | null>(null);
  const [importStartDate, setImportStartDate] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  });
  const [importMins, setImportMins] = useState(10);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setImportConfig({ file });
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importConfig || !session) return;
    setImporting(true);
    try {
      const text = await importConfig.file.text();
      const newMatches = parseMatchCsv(
        text,
        sessionId,
        session.format,
        new Date(importStartDate),
        importMins,
      );
      if (newMatches.length > 0) {
        await vgcDb.matches.bulkPut(newMatches);
        for (const match of newMatches) {
          pushChange('matches', match.id, match);
        }
        await refreshMatches();
      }
    } finally {
      setImporting(false);
      setImportConfig(null);
    }
  };

  const wins = matches.filter((m) => m.result === 'win').length;
  const losses = matches.filter((m) => m.result === 'loss').length;
  const draws = matches.filter((m) => m.result === 'draw').length;
  const latestElo = [...matches]
    .sort((a, b) => b.createdAt - a.createdAt)
    .find((m) => m.eloAfter !== undefined)?.eloAfter;

  const handleNewMatch = async () => {
    if (!session) return;
    const match: Match = {
      id: crypto.randomUUID(),
      sessionId,
      format: session.format,
      createdAt: Date.now(),
      myTeam: { presetId: preset?.id, slots: preset ? slotsFromPreset(preset) : emptySlots() },
      opponentTeam: { slots: emptySlots() },
      notes: [],
    };
    await createMatch(match);
    router.push(`/pokemon/vgc/tracker/${sessionId}/${match.id}`);
  };

  const handleNewSeries = async () => {
    if (!session) return;
    const myTeamSlots = preset ? slotsFromPreset(preset) : emptySlots();
    const firstGame: SeriesGame = {
      id: crypto.randomUUID(),
      gameNumber: 1,
      mySlots: slotsForGame(myTeamSlots),
      opponentSlots: emptySlots(),
      notes: [],
    };
    const series: Series = {
      id: crypto.randomUUID(),
      sessionId,
      createdAt: Date.now(),
      myTeam: { presetId: preset?.id, slots: myTeamSlots },
      opponentTeam: { slots: emptySlots() },
      games: [firstGame],
      notes: [],
    };
    await createSeries(series);
    router.push(`/pokemon/vgc/tracker/${sessionId}/series/${series.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/pokemon/vgc/tracker"
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${isTournament ? 'bg-amber-500/15 border-amber-500/30' : 'bg-primary-500/20 border-primary-500/30'}`}>
                {isTournament
                  ? <Trophy className="w-5 h-5 text-amber-400" />
                  : <Swords className="w-5 h-5 text-primary-400" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-50">{session?.label ?? 'Session'}</h1>
                <p className="text-surface-500 text-xs">
                  {isTournament && session?.tournamentName
                    ? <>{session.tournamentName} · {session.regulationId}</>
                    : <>{session?.regulationId} · {session?.format}</>}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export / import */}
            <button
              onClick={() => setShowExportImport(true)}
              className="p-2 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 transition-colors"
              title={t('exportImport.title')}
            >
              <Database size={14} />
            </button>

            {/* Change preset (ladder only, when multiple presets for this regulation) */}
            {!isTournament && sessionPresets.length > 1 && (
              <button
                onClick={() => setShowPresetPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-700 text-surface-300 hover:text-surface-50 hover:border-surface-600 text-sm transition-colors"
              >
                <Layers size={14} /> {preset?.name ?? t('buttons.changePreset')}
              </button>
            )}

            {!isTournament && (
              <>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium transition-colors disabled:opacity-50"
                  title={t('tooltips.importCsv')}
                >
                  <Upload size={14} />{importing ? t('buttons.importing') : t('buttons.importCsv')}
                </button>
              </>
            )}
            <button
              onClick={isTournament ? handleNewSeries : handleNewMatch}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${isTournament ? 'bg-amber-600 hover:bg-amber-500' : 'bg-primary-600 hover:bg-primary-500'}`}
            >
              <Plus size={14} /> {isTournament ? t('buttons.newSeries') : t('buttons.newMatch')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      {isTournament ? (() => {
        const seriesWins = seriesList.filter((s) => s.seriesResult === 'win').length;
        const seriesLosses = seriesList.filter((s) => s.seriesResult === 'loss').length;
        const allGames = seriesList.flatMap((s) => s.games);
        const gameWins = allGames.filter((g) => g.result === 'win').length;
        const gameLosses = allGames.filter((g) => g.result === 'loss').length;
        return (
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={seriesWins} label={t('tournament.seriesWins')} color="text-green-400" />
            <StatCard value={seriesLosses} label={t('tournament.seriesLosses')} color="text-red-400" />
            <StatCard value={`${gameWins}–${gameLosses}`} label={t('tournament.gameRecord')} color="text-surface-300" />
          </div>
        );
      })() : (
        <div className="grid grid-cols-4 gap-3">
          <StatCard value={wins} label={t('stats.wins')} color="text-green-400" />
          <StatCard value={draws} label={t('stats.draws')} color="text-yellow-400" />
          <StatCard value={losses} label={t('stats.losses')} color="text-red-400" />
          <StatCard
            value={latestElo ?? session?.startElo ?? '—'}
            label={t('stats.elo')}
            color={
              latestElo !== undefined && session?.startElo !== undefined
                ? latestElo >= session.startElo ? 'text-green-400' : 'text-red-400'
                : 'text-surface-300'
            }
          />
        </div>
      )}

      {/* ── Session notes ───────────────────────────────────────────────── */}
      <SessionNotesEditor session={session} onSave={(notes) => session && updateSession(session.id, { sessionNotes: notes })} />

      {/* ── Tabs (ladder only) ───────────────────────────────────────────── */}
      {!isTournament && <div className="flex rounded-lg border border-surface-800 bg-surface-950 p-0.5 gap-0.5">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'matches'
              ? 'bg-surface-800 text-surface-50'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          {tStats('tabs.matches')}
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'stats'
              ? 'bg-surface-800 text-surface-50'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          {tStats('tabs.stats')}
        </button>
      </div>}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isTournament ? (
        seriesLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : seriesList.length === 0 ? (
          <div className="rounded-xl border border-surface-800 bg-surface-950 p-12 text-center">
            <Trophy size={36} className="mx-auto text-surface-700 mb-3" />
            <p className="text-surface-400 text-sm">{t('tournament.noSeries')}</p>
          </div>
        ) : (
          <TournamentSeriesList
            seriesList={seriesList}
            sessionId={sessionId}
            roundFilter={roundFilter}
            onRoundFilter={setRoundFilter}
          />
        )
      ) : activeTab === 'stats' ? (
        <SessionStatsView
          sessionId={sessionId}
          regulationId={session?.regulationId}
          startElo={session?.startElo}
          ladderSessions={sessions.filter((s) => s.type === 'ladder')}
        />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-surface-800 bg-surface-950 p-12 text-center">
          <Swords size={36} className="mx-auto text-surface-700 mb-3" />
          <p className="text-surface-400 text-sm">{t('empty.noMatches')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(() => {
            const asc = [...matches].sort((a, b) => a.createdAt - b.createdAt);
            const eloDeltas = new Map<string, number>();
            asc.forEach((m, i) => {
              const prev = i === 0 ? session?.startElo : asc[i - 1].eloAfter;
              if (m.eloAfter !== undefined && prev !== undefined) {
                eloDeltas.set(m.id, m.eloAfter - prev);
              }
            });
            return matches.map((m, i) => (
              <MatchRow
                key={m.id}
                match={m}
                number={matches.length - i}
                sessionId={sessionId}
                eloDelta={eloDeltas.get(m.id)}
              />
            ));
          })()}
        </div>
      )}

      {/* Preset picker */}
      {showPresetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-700">
              <h2 className="font-semibold text-surface-50">{t('preset.changeTitle')}</h2>
              <button onClick={() => setShowPresetPicker(false)} className="text-surface-400 hover:text-surface-50 transition-colors">
                ×
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {sessionPresets.map((p) => {
                const isActive = p.id === session?.activePresetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      updateSession(sessionId, { activePresetId: p.id });
                      setShowPresetPicker(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-primary-500/15 border-primary-500/40 text-surface-50'
                        : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                    }`}
                  >
                    <div className="flex -space-x-2 shrink-0">
                      {p.slots.slice(0, 3).map((s) => (
                        <img key={s.slotIndex} src={spriteUrl(s.speciesName)} alt={s.speciesName} className="w-7 h-7 object-contain" onError={handleSpriteError} />
                      ))}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    {isActive && <span className="text-[10px] text-primary-400 font-mono shrink-0">{t('preset.currentTag')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Export / Import */}
      {showExportImport && (
        <ExportImportDialog
          sessionId={sessionId}
          sessionLabel={session?.label}
          onImportDone={() => { refreshMatches(); }}
          onClose={() => setShowExportImport(false)}
        />
      )}

      {/* Import config modal */}
      {importConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <h2 className="text-surface-50 font-semibold text-base">{t('modals.importCsv')}</h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-surface-400 font-medium">{t('labels.startDate')}</label>
                <input
                  type="datetime-local"
                  value={importStartDate}
                  onChange={(e) => setImportStartDate(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-surface-400 font-medium">{t('labels.minsPerGame')}</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={importMins}
                  onChange={(e) => setImportMins(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setImportConfig(null)}
                className="px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {importing ? t('buttons.importing') : t('buttons.importFile', { name: importConfig.file.name })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionNotesEditor({
  session,
  onSave,
}: {
  session: { sessionNotes?: string } | undefined;
  onSave: (notes: string) => void;
}) {
  const t = useTranslations('vgc.tracker');
  const [value, setValue] = useState(session?.sessionNotes ?? '');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (text: string) => {
    setValue(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave(text), 800);
  };

  if (!session) return null;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-surface-800">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
          {t('sessionNotes.label')}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t('sessionNotes.placeholder')}
        rows={3}
        className="w-full bg-transparent px-4 py-3 text-sm text-surface-200 placeholder:text-surface-700 focus:outline-none resize-none"
      />
    </div>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-4 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-surface-500 mt-0.5">{label}</div>
    </div>
  );
}

function MatchRow({ match, number, sessionId, eloDelta }: { match: Match; number: number; sessionId: string; eloDelta?: number }) {
  const t = useTranslations('vgc.tracker');
  const router = useRouter();

  // ELO delta: colored by result
  const deltaColor = eloDelta === undefined
    ? 'text-surface-500'
    : match.result === 'win'
    ? 'text-green-400'
    : match.result === 'loss'
    ? 'text-red-400'
    : 'text-surface-400';
  const deltaSign = eloDelta !== undefined && eloDelta >= 0 ? '+' : '';

  // Build sprite rows for my team (no links)
  const spritesFor = (slots: typeof match.myTeam.slots) => {
    const filled = slots.filter((s) => s.speciesId !== null);
    if (filled.length === 0) return null;
    const order: Record<string, number> = { lead1: 0, lead2: 1, back1: 2, back2: 3, unknown: 4 };
    const sorted = [...filled].sort((a, b) => order[a.role] - order[b.role]);
    return sorted.map((s) => (
      <img
        key={s.slotIndex}
        src={spriteUrl(s.speciesName!)}
        alt={s.speciesName ?? ''}
        title={s.speciesName ?? ''}
        className={`w-6 h-6 object-contain transition-opacity ${
          s.role === 'unknown' ? 'opacity-25 grayscale' : 'opacity-100'
        }`}
        onError={handleSpriteError}
      />
    ));
  };

  // Build opponent sprite row (no links)
  const oppSpritesFor = (slots: typeof match.opponentTeam.slots) => {
    const filled = slots.filter((s) => s.speciesId !== null);
    if (filled.length === 0) return null;
    const order: Record<string, number> = { lead1: 0, lead2: 1, back1: 2, back2: 3, unknown: 4 };
    const sorted = [...filled].sort((a, b) => order[a.role] - order[b.role]);
    return sorted.map((s) => (
      <img
        key={s.slotIndex}
        src={spriteUrl(s.speciesName!)}
        alt={s.speciesName ?? ''}
        title={s.speciesName ?? ''}
        className={`w-6 h-6 object-contain transition-opacity ${s.role === 'unknown' ? 'opacity-25 grayscale' : 'opacity-100'}`}
        onError={handleSpriteError}
      />
    ));
  };

  const mySprites = spritesFor(match.myTeam.slots);
  const oppSprites = oppSpritesFor(match.opponentTeam.slots);
  const hasSprites = mySprites || oppSprites;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/pokemon/vgc/tracker/${sessionId}/${match.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/pokemon/vgc/tracker/${sessionId}/${match.id}`)}
      className="flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-950 hover:border-primary-500/40 px-3 py-2.5 transition-all cursor-pointer"
    >
      {/* Result badge */}
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
          match.result === 'win'
            ? 'bg-green-500/15 text-green-400 border-green-500/30'
            : match.result === 'loss'
            ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : match.result === 'draw'
            ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
            : 'bg-surface-800 text-surface-500 border-surface-700'
        }`}
      >
        {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : match.result === 'draw' ? 'D' : '—'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Top line */}
        <div className="flex items-center gap-2 text-sm mb-1">
          <span className="text-surface-200 font-medium">{t('matchRow.match', { number })}</span>
          {match.opponentName && (
            <span className="text-surface-400 text-xs">{t('matchRow.vs')} {match.opponentName}</span>
          )}
          <div className="ml-auto shrink-0 flex items-center gap-2">
            {eloDelta !== undefined && (
              <span className={`font-mono text-xs font-semibold ${deltaColor}`}>
                {deltaSign}{Number.isInteger(eloDelta) ? eloDelta : eloDelta.toFixed(1)}
              </span>
            )}
            {match.eloAfter !== undefined && (
              <span className="text-xs text-surface-400 font-mono">{match.eloAfter}</span>
            )}
            {match.opponentElo !== undefined && (
              <span className="text-xs text-surface-600 font-mono">vs {match.opponentElo}</span>
            )}
          </div>
        </div>

        {/* Sprite rows */}
        {hasSprites ? (
          <div className="flex items-center gap-1.5">
            {mySprites && <div className="flex items-center gap-0.5">{mySprites}</div>}
            {mySprites && oppSprites && (
              <span className="text-surface-300 text-[11px] font-semibold px-1">vs</span>
            )}
            {oppSprites && <div className="flex items-center gap-0.5">{oppSprites}</div>}
            <span className="text-surface-600 text-xs ml-1">{formatTime(match.createdAt)}</span>
            {match.notes.length > 0 && (
              <span className="text-surface-600 text-xs">{match.notes.length === 1 ? t('matchRow.noteSingular') : t('matchRow.notesPlural', { count: match.notes.length })}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-600">{t('matchRow.noPicks')}</span>
            <span className="text-surface-600 text-xs">{formatTime(match.createdAt)}</span>
            {match.notes.length > 0 && (
              <span className="text-surface-600 text-xs">{match.notes.length === 1 ? t('matchRow.noteSingular') : t('matchRow.notesPlural', { count: match.notes.length })}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentSeriesList({
  seriesList,
  sessionId,
  roundFilter,
  onRoundFilter,
}: {
  seriesList: Series[];
  sessionId: string;
  roundFilter: number | null;
  onRoundFilter: (r: number | null) => void;
}) {
  const t = useTranslations('vgc.tracker');
  const rounds = [...new Set(seriesList.flatMap((s) => s.roundNumber !== undefined ? [s.roundNumber] : []))].sort((a, b) => a - b);
  const displayed = roundFilter !== null ? seriesList.filter((s) => s.roundNumber === roundFilter) : seriesList;

  return (
    <div className="flex flex-col gap-2">
      {rounds.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onRoundFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              roundFilter === null ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-surface-500 hover:text-surface-300 border border-surface-800'
            }`}
          >
            {t('tournament.allRounds')}
          </button>
          {rounds.map((r) => (
            <button
              key={r}
              onClick={() => onRoundFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                roundFilter === r ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-surface-500 hover:text-surface-300 border border-surface-800'
              }`}
            >
              {t('tournament.round', { n: r })}
            </button>
          ))}
        </div>
      )}
      {displayed.map((s) => (
        <SeriesRow key={s.id} series={s} number={seriesList.length - seriesList.indexOf(s)} sessionId={sessionId} />
      ))}
    </div>
  );
}

function SeriesRow({ series, number, sessionId }: { series: Series; number: number; sessionId: string }) {
  const t = useTranslations('vgc.tracker');
  const { wins, losses } = seriesScore(series.games);
  const isOngoing = !series.seriesResult;
  const scoreLabel = isOngoing ? `${wins}–${losses}` : series.seriesResult === 'win' ? `2–${losses}` : `${wins}–2`;

  const allGameSlots = series.games.flatMap((g) => {
    const myLeads = g.mySlots.filter((s) => s.speciesId && (s.role === 'lead1' || s.role === 'lead2'));
    return myLeads;
  });
  const oppPreview = series.opponentTeam.slots.filter((s) => s.speciesId);

  return (
    <Link
      href={`/pokemon/vgc/tracker/${sessionId}/series/${series.id}`}
      className="flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-950 hover:border-amber-500/30 px-3 py-2.5 transition-all"
    >
      {/* Result badge */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
        series.seriesResult === 'win'
          ? 'bg-green-500/15 text-green-400 border-green-500/30'
          : series.seriesResult === 'loss'
          ? 'bg-red-500/15 text-red-400 border-red-500/30'
          : 'bg-surface-800 text-surface-500 border-surface-700'
      }`}>
        {series.seriesResult === 'win' ? 'W' : series.seriesResult === 'loss' ? 'L' : '—'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm mb-1">
          {series.roundNumber && (
            <span className="text-surface-500 text-xs font-mono">{t('tournament.round', { n: series.roundNumber })}</span>
          )}
          {series.opponentName && (
            <span className="text-surface-200 font-medium truncate">{series.opponentName}</span>
          )}
          {!series.opponentName && (
            <span className="text-surface-500 font-medium">{t('tournament.seriesNumber', { n: number })}</span>
          )}
          <span className={`ml-auto shrink-0 font-mono text-xs font-semibold ${
            series.seriesResult === 'win' ? 'text-green-400' : series.seriesResult === 'loss' ? 'text-red-400' : 'text-surface-400'
          }`}>{scoreLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {allGameSlots.length > 0 && (
            <div className="flex items-center gap-0.5">
              {allGameSlots.map((s, i) => (
                <img key={i} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="w-5 h-5 object-contain" onError={handleSpriteError} />
              ))}
            </div>
          )}
          {allGameSlots.length > 0 && oppPreview.length > 0 && (
            <span className="text-surface-500 text-[10px] font-semibold px-0.5">{t('matchRow.vs')}</span>
          )}
          {oppPreview.length > 0 && (
            <div className="flex items-center gap-0.5">
              {oppPreview.slice(0, 6).map((s) => (
                <img key={s.slotIndex} src={spriteUrl(s.speciesName!)} alt={s.speciesName ?? ''} className="w-5 h-5 object-contain" onError={handleSpriteError} />
              ))}
            </div>
          )}
          <span className="text-surface-600 text-xs ml-auto">{formatTime(series.createdAt)}</span>
          {series.notes.length > 0 && (
            <span className="text-surface-600 text-xs">{series.notes.length === 1 ? t('matchRow.noteSingular') : t('matchRow.notesPlural', { count: series.notes.length })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
