'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionStats } from '@/features/vgc-tracker/hooks/useSessionStats';
import { EloChart } from './EloChart';
import { PokemonUsageTable } from './PokemonUsageTable';

const TABLE_TABS = ['myTeam', 'preview', 'leads', 'backs'] as const;
type TableTab = (typeof TABLE_TABS)[number];

interface Props {
  sessionId: string;
  startElo?: number;
}

export function SessionStatsView({ sessionId, startElo }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const { stats, loading } = useSessionStats(sessionId, startElo);
  const [tableTab, setTableTab] = useState<TableTab>('myTeam');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { record, elo, eloTimeline } = stats;

  // ── Display values ─────────────────────────────────────────────────────────

  const wrDisplay =
    record.winRate !== null ? `${Math.round(record.winRate * 100)}%` : '—';
  const wrColor =
    record.winRate === null
      ? 'text-surface-400'
      : record.winRate >= 0.5
      ? 'text-green-400'
      : 'text-red-400';

  const streakDisplay =
    record.streak === null
      ? '—'
      : record.streak.type === 'win'
      ? t('kpi.streakWin', { count: record.streak.count })
      : t('kpi.streakLoss', { count: record.streak.count });
  const streakColor =
    record.streak === null
      ? 'text-surface-400'
      : record.streak.type === 'win'
      ? 'text-green-400'
      : 'text-red-400';

  const eloColor =
    elo.current === null || startElo === undefined
      ? 'text-surface-200'
      : elo.current >= startElo
      ? 'text-green-400'
      : 'text-red-400';

  const fmtDelta = (v: number | null) => {
    if (v === null) return '—';
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}`;
  };
  const avgDeltaColor =
    elo.avgDeltaPerMatch === null
      ? 'text-surface-400'
      : elo.avgDeltaPerMatch >= 0
      ? 'text-green-400'
      : 'text-red-400';

  // ── Table data ─────────────────────────────────────────────────────────────

  const tabData = {
    myTeam: stats.myPokemon,
    preview: stats.opponentPreview,
    leads: stats.opponentLeads,
    backs: stats.opponentBacks,
  };

  const tabLabels: Record<TableTab, string> = {
    myTeam: t('table.tabs.myTeam'),
    preview: t('table.tabs.preview'),
    leads: t('table.tabs.leads'),
    backs: t('table.tabs.backs'),
  };

  return (
    <div className="space-y-4">
      {/* ── Primary KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label={t('kpi.played')}
          value={record.played}
          color="text-surface-200"
        />
        <KpiCard
          label={t('kpi.winRate')}
          value={wrDisplay}
          color={wrColor}
        />
        <KpiCard
          label={t('kpi.streak')}
          value={streakDisplay}
          color={streakColor}
          small
        />
        <KpiCard
          label={t('kpi.eloNow')}
          value={elo.current ?? '—'}
          color={eloColor}
        />
      </div>

      {/* ── Secondary ELO KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          small
          label={t('kpi.eloBest')}
          value={elo.best ?? '—'}
          color="text-green-400"
        />
        <KpiCard
          small
          label={t('kpi.eloWorst')}
          value={elo.worst ?? '—'}
          color="text-red-400"
        />
        <KpiCard
          small
          label={t('kpi.avgDelta')}
          value={fmtDelta(elo.avgDeltaPerMatch)}
          color={avgDeltaColor}
        />
      </div>

      {/* ── ELO Chart ─────────────────────────────────────────────────────── */}
      {eloTimeline.length > 0 && (
        <div className="rounded-xl border border-surface-800 bg-surface-950 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">
            {t('chart.title')}
          </h3>
          <EloChart timeline={eloTimeline} startElo={startElo} />
        </div>
      )}

      {/* ── Pokémon tables ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex border-b border-surface-800">
          {TABLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTableTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tableTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400 -mb-px bg-primary-500/5'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <PokemonUsageTable
          items={tabData[tableTab]}
          showDiscards={tableTab === 'preview'}
        />
      </div>
    </div>
  );
}

// ─── Local helper ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-3 text-center">
      <div
        className={`font-bold tabular-nums leading-tight ${
          small ? 'text-lg' : 'text-2xl'
        } ${color}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-surface-500 mt-0.5">{label}</div>
    </div>
  );
}
