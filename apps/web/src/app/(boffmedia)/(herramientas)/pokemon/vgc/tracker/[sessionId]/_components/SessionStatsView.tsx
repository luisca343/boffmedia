'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/primitives/card';
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
import { HeatmapSection } from './HeatmapSection';
import { MatchupMatrixSection } from './MatchupMatrixSection';
import { ArchetypeSection } from './ArchetypeSection';
import { UsageTableTabs } from './UsageTableTabs';

const TABLE_TABS = ['myTeam', 'preview', 'leads', 'backs'] as const;
type TableTab = (typeof TABLE_TABS)[number];

const MAX_COMPARE = 5;

interface Props {
  sessionId: string;
  regulationId?: string;
  startElo?: number;
  limitlessTournamentId?: number;
  ladderSessions?: Session[];
}

export function SessionStatsView({ sessionId, regulationId, startElo, limitlessTournamentId, ladderSessions = [] }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const { stats, loading } = useSessionStats(sessionId, startElo);
  const { meta: regulationMeta, loading: metaLoading } = useRegulationMeta(regulationId, limitlessTournamentId);
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
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { record, elo, eloTimeline } = stats;

  // ── Display values ─────────────────────────────────────────────────────────

  const wrDisplay =
    record.winRate !== null ? `${Math.round(record.winRate * 100)}%` : '—';
  const wrColor =
    record.winRate === null
      ? 'text-ink-muted'
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
      ? 'text-ink-muted'
      : record.streak.type === 'win'
      ? 'text-green-400'
      : 'text-red-400';

  const bestStreakDisplay =
    record.bestStreak === null
      ? '—'
      : record.bestStreak.type === 'win'
      ? t('kpi.streakWin', { count: record.bestStreak.count })
      : t('kpi.streakLoss', { count: record.bestStreak.count });
  const bestStreakColor =
    record.bestStreak === null
      ? 'text-ink-muted'
      : record.bestStreak.type === 'win'
      ? 'text-green-400'
      : 'text-red-400';

  const eloColor =
    elo.current === null || startElo === undefined
      ? 'text-ink'
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
      ? 'text-ink-muted'
      : elo.avgDeltaPerMatch >= 0
      ? 'text-green-400'
      : 'text-red-400';

  // ── Table data ─────────────────────────────────────────────────────────────

  const tabConfig: Record<TableTab, { items: typeof stats.myPokemon; showDiscards: boolean; label: string }> = {
    myTeam: { items: stats.myPokemon, showDiscards: false, label: t('table.tabs.myTeam') },
    preview: { items: stats.opponentPreview, showDiscards: true, label: t('table.tabs.preview') },
    leads: { items: stats.opponentLeads, showDiscards: false, label: t('table.tabs.leads') },
    backs: { items: stats.opponentBacks, showDiscards: false, label: t('table.tabs.backs') },
  };

  return (
    <div className="space-y-4">
      {/* ── Primary KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label={t('kpi.played')} value={record.played} color="text-ink" />
        <KpiCard label={t('kpi.winRate')} value={wrDisplay} color={wrColor} />
        <KpiCard label={t('kpi.streak')} value={streakDisplay} color={streakColor} small />
        <KpiCard label={t('kpi.eloNow')} value={elo.current ?? '—'} color={eloColor} />
      </div>

      {/* ── Secondary ELO KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard small label={t('kpi.eloBest')} value={elo.best ?? '—'} color="text-green-400" />
        <KpiCard small label={t('kpi.eloWorst')} value={elo.worst ?? '—'} color="text-red-400" />
        <KpiCard small label={t('kpi.avgDelta')} value={fmtDelta(elo.avgDeltaPerMatch)} color={avgDeltaColor} />
        <KpiCard small label={t('kpi.bestStreak')} value={bestStreakDisplay} color={bestStreakColor} />
      </div>

      {/* ── ELO Chart ─────────────────────────────────────────────────────── */}
      {eloTimeline.length > 0 && (
        <Card className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-ink mb-3">{t('chart.title')}</h3>
          <EloChart timeline={eloTimeline} startElo={startElo} />
        </Card>
      )}

      {/* ── Session comparison ────────────────────────────────────────────── */}
      {comparableSessions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
            <span className="text-sm font-semibold text-ink">{t('comparison.title')}</span>
            {compareIds.length > 0 && (
              <button
                onClick={() => setCompareIds([])}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
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
                      ? 'bg-primary/15 border-primary/40 text-primary-hover'
                      : maxReached
                      ? 'border-edge text-ink-dim cursor-not-allowed'
                      : 'border-edge text-ink-muted hover:text-ink hover:border-edge'
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
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comparisonSeries.length > 0 ? (
            <div className="px-4 pb-3">
              <SessionComparisonChart currentSessionId={sessionId} series={comparisonSeries} />
            </div>
          ) : (
            <p className="px-4 pb-4 text-xs text-ink-dim">{t('comparison.hint')}</p>
          )}
        </Card>
      )}

      {/* ── Pokémon tables ────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <UsageTableTabs
          tabs={TABLE_TABS.map((tab) => ({ key: tab, label: tabConfig[tab].label }))}
          active={tableTab}
          onChange={setTableTab}
        />
        <PokemonUsageTable
          items={tabConfig[tableTab].items}
          showDiscards={tabConfig[tableTab].showDiscards}
        />
      </Card>

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

      {/* ── Archetype breakdown ───────────────────────────────────────────── */}
      <ArchetypeSection archetypes={stats.archetypeBreakdown} />

      {/* ── Pair win rates ────────────────────────────────────────────────── */}
      <MatchupMatrixSection pairs={stats.matchupMatrix} />

      {/* ── Activity heatmap ──────────────────────────────────────────────── */}
      <HeatmapSection heatmap={stats.heatmap} />
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
    <div className="rounded-xl border border-edge bg-layer-2 p-3 text-center">
      <div className={`font-bold tabular-nums leading-tight ${small ? 'text-lg' : 'text-2xl'} ${color}`}>
        {value}
      </div>
      <div className="text-[10px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
