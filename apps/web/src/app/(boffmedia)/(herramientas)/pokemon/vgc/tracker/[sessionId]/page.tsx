'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Swords, TrendingUp } from 'lucide-react';
import { useMatches, useSessions, usePreset } from '@/features/vgc-tracker/hooks/useVgcDb';
import { emptySlots, slotsFromPreset, spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import type { Match } from '@/features/vgc-tracker/types';

interface Props {
  params: Promise<{ sessionId: string }>;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function SessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);
  const { matches, loading, create: createMatch } = useMatches(sessionId);
  const preset = usePreset(session?.activePresetId ?? null);

  const wins = matches.filter((m) => m.result === 'win').length;
  const losses = matches.filter((m) => m.result === 'loss').length;
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

          <button
            onClick={handleNewMatch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={14} /> New match
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={wins} label="Wins" color="text-green-400" />
        <StatCard value={losses} label="Losses" color="text-red-400" />
        <StatCard
          value={latestElo ?? session?.startElo ?? '—'}
          label="ELO"
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
          <p className="text-surface-400 text-sm">No matches yet — start one!</p>
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
  const opponentFilled = match.opponentTeam.slots.filter((s) => s.speciesId !== null);
  const deltaSign = eloDelta !== undefined ? (eloDelta >= 0 ? '+' : '') : '';
  const deltaColor = eloDelta === undefined ? '' : eloDelta > 0 ? 'text-green-400' : eloDelta < 0 ? 'text-red-400' : 'text-surface-400';

  return (
    <Link
      href={`/pokemon/vgc/tracker/${sessionId}/${match.id}`}
      className="group flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-950 hover:border-primary-500/40 px-3 py-2.5 transition-all"
    >
      {/* Result badge */}
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
          match.result === 'win'
            ? 'bg-green-500/15 text-green-400 border-green-500/30'
            : match.result === 'loss'
            ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : 'bg-surface-800 text-surface-500 border-surface-700'
        }`}
      >
        {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : '—'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm mb-0.5">
          <span className="text-surface-200 font-medium">Match #{number}</span>
          {match.opponentName && (
            <span className="text-surface-400 text-xs">vs {match.opponentName}</span>
          )}
          {match.eloAfter !== undefined && (
            <span className="flex items-center gap-1 text-xs text-surface-400 ml-auto shrink-0">
              <TrendingUp size={10} />
              {match.eloAfter}
              {eloDelta !== undefined && (
                <span className={`font-mono ${deltaColor}`}>
                  ({deltaSign}{Number.isInteger(eloDelta) ? eloDelta : eloDelta.toFixed(1)})
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {opponentFilled.slice(0, 4).map((s) => (
              <img
                key={s.slotIndex}
                src={spriteUrl(s.speciesName!)}
                alt={s.speciesName ?? ''}
                className="w-6 h-6 object-contain"
                onError={handleSpriteError}
              />
            ))}
            {opponentFilled.length === 0 && (
              <span className="text-xs text-surface-600">No opponent entered</span>
            )}
          </div>
          <span className="text-surface-600 text-xs">{formatTime(match.createdAt)}</span>
          {match.notes.length > 0 && (
            <span className="text-surface-600 text-xs">{match.notes.length} note{match.notes.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
