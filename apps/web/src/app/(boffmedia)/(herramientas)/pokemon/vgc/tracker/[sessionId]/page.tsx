'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Swords, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMatches, useSessions, usePreset } from '@/features/vgc-tracker/hooks/useVgcDb';
import { emptySlots, slotsFromPreset, spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { parseMatchCsv } from '@/features/vgc-tracker/utils/importCsv';
import { vgcDb } from '@/lib/db/vgc-db';
import type { Match } from '@/features/vgc-tracker/types';

interface Props {
  params: Promise<{ sessionId: string }>;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function SessionPage({ params }: Props) {
  const t = useTranslations('vgc.tracker');
  const { sessionId } = use(params);
  const router = useRouter();
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);
  const { matches, loading, create: createMatch, refresh: refreshMatches } = useMatches(sessionId);
  const preset = usePreset(session?.activePresetId ?? null);

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
              <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                <Swords className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-50">{session?.label ?? 'Session'}</h1>
                <p className="text-surface-500 text-xs">{session?.regulationId} · {session?.format}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium transition-colors disabled:opacity-50"
              title={t('tooltips.importCsv')}
            >
              <Upload size={14} />{importing ? t('buttons.importing') : t('buttons.importCsv')}
            </button>
            <button
              onClick={handleNewMatch}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} /> {t('buttons.newMatch')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
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

      {/* Match list */}
      {loading ? (
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
  const isCompleted = !!match.completedAt;

  // ELO delta: colored by result
  const deltaColor = eloDelta === undefined
    ? 'text-surface-500'
    : match.result === 'win'
    ? 'text-green-400'
    : match.result === 'loss'
    ? 'text-red-400'
    : 'text-surface-400';
  const deltaSign = eloDelta !== undefined && eloDelta >= 0 ? '+' : '';

  // Build sprite rows: picked slots (lead/back) bright; discards dim
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

  const mySprites = spritesFor(match.myTeam.slots);
  const oppSprites = spritesFor(match.opponentTeam.slots);
  const hasSprites = mySprites || oppSprites;

  return (
    <Link
      href={`/pokemon/vgc/tracker/${sessionId}/${match.id}`}
      className="flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-950 hover:border-primary-500/40 px-3 py-2.5 transition-all"
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
    </Link>
  );
}
