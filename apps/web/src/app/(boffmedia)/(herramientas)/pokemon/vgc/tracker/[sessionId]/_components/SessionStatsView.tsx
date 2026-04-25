'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSessionStats } from '@/features/vgc-tracker/hooks/useSessionStats';
import { useRegulationMeta } from '@/features/vgc-tracker/hooks/useRegulationMeta';
import { useComparisonElo } from '@/features/vgc-tracker/hooks/useComparisonElo';
import type { Session } from '@/features/vgc-tracker/types';
import { EloChart } from './EloChart';
import { PokemonUsageTable } from './PokemonUsageTable';
import { LeadPairsSection } from './LeadPairsSection';
import { TimeSlotsSection } from './TimeSlotsSection';
import { RegulationMetaSection } from './RegulationMetaSection';
import { SessionComparisonChart } from './SessionComparisonChart';

const TABLE_TABS = ['myTeam', 'preview', 'leads', 'backs'] as const;
type TableTab = (typeof TABLE_TABS)[number];

const MAX_COMPARE = 5;

interface Props {
  sessionId: string;
  regulationId?: string;
  startElo?: number;
  ladderSessions?: Session[];
}

export function SessionStatsView({ sessionId, regulationId, startElo, ladderSessions = [] }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const { stats, loading } = useSessionStats(sessionId, startElo);
  const { meta: regulationMeta, loading: metaLoading } = useRegulationMeta(regulationId);
  const [tableTab, setTableTab] = useState<TableTab>('myTeam');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const { series: comparisonSeries, loading: compLoading } = useComparisonElo(
    compareIds.length > 0 ? [sessionId, ...compareIds] : [],
    ladderSessions,
  );

  const comparableSessions = ladderSessions.filter(
    (s) => s.id !== sessionId && s.type === 'ladder',
  );

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
        <KpiCard label={t('kpi.played')} value={record.played} color="text-surface-200" />
        <KpiCard label={t('kpi.winRate')} value={wrDisplay} color={wrColor} />
        <KpiCard label={t('kpi.streak')} value={streakDisplay} color={streakColor} small />
        <KpiCard label={t('kpi.eloNow')} value={elo.current ?? '—'} color={eloColor} />
      </div>

      {/* ── Secondary ELO KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard small label={t('kpi.eloBest')} value={elo.best ?? '—'} color="text-green-400" />
        <KpiCard small label={t('kpi.eloWorst')} value={elo.worst ?? '—'} color="text-red-400" />
        <KpiCard small label={t('kpi.avgDelta')} value={fmtDelta(elo.avgDeltaPerMatch)} color={avgDeltaColor} />
      </div>

      {/* ── ELO Chart ─────────────────────────────────────────────────────── */}
      {eloTimeline.length > 0 && (
        <div className="rounded-xl border border-surface-800 bg-surface-950 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">{t('chart.title')}</h3>
          <EloChart timeline={eloTimeline} startElo={startElo} />
        </div>
      )}

      {/* ── Session comparison ────────────────────────────────────────────── */}
      {comparableSessions.length > 0 && (
        <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
            <span className="text-sm font-semibold text-surface-300">{t('comparison.title')}</span>
            {compareIds.length > 0 && (
              <button
                onClick={() => setCompareIds([])}
                className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
              >
                {t('comparison.clearAll')}
              </button>
            )}
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {comparableSessions.map((s) => {
              const active = compareIds.includes(s.id);
              const maxReached = !active && compareIds.length >= MAX_COMPARE;
              return (
                <button
                  key={s.id}
                  disabled={maxReached}
                  onClick={() =>
                    setCompareIds((ids) =>
                      active ? ids.filter((id) => id !== s.id) : [...ids, s.id],
                    )
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-primary-500/15 border-primary-500/40 text-primary-400'
                      : maxReached
                      ? 'border-surface-800 text-surface-700 cursor-not-allowed'
                      : 'border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600'
                  }`}
                >
                  {s.label}
                  {active && <X size={10} />}
                </button>
              );
            })}
          </div>
          {compLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comparisonSeries.length > 0 ? (
            <div className="px-4 pb-3">
              <SessionComparisonChart currentSessionId={sessionId} series={comparisonSeries} />
            </div>
          ) : (
            <p className="px-4 pb-4 text-xs text-surface-600">{t('comparison.hint')}</p>
          )}
        </div>
      )}

      {/* ── Pokémon tables ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
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
        <PokemonUsageTable items={tabData[tableTab]} showDiscards={tableTab === 'preview'} />
      </div>

      {/* ── Lead pairs ────────────────────────────────────────────────────── */}
      <LeadPairsSection myPairs={stats.myLeadPairs} opponentPairs={stats.opponentLeadPairs} />

      {/* ── Time of day ───────────────────────────────────────────────────── */}
      <TimeSlotsSection slots={stats.timeSlots} />

      {/* ── Regulation meta (cross-session) ───────────────────────────────── */}
      {regulationId && (
        <RegulationMetaSection
          regulationId={regulationId}
          meta={regulationMeta}
          loading={metaLoading}
        />
      )}
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
      <div className={`font-bold tabular-nums leading-tight ${small ? 'text-lg' : 'text-2xl'} ${color}`}>
        {value}
      </div>
      <div className="text-[10px] text-surface-500 mt-0.5">{label}</div>
    </div>
  );
}
