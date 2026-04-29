'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RegulationMeta } from '@/features/vgc-tracker/hooks/useRegulationMeta';
import { PokemonUsageTable } from './PokemonUsageTable';
import { UsageTableTabs } from './UsageTableTabs';

type MetaTab = 'preview' | 'leads' | 'backs';
const META_TABS: MetaTab[] = ['preview', 'leads', 'backs'];

interface Props {
  regulationId: string;
  meta: RegulationMeta | null;
  loading: boolean;
}

export function RegulationMetaSection({ regulationId, meta, loading }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const [tab, setTab] = useState<MetaTab>('preview');
  const tabConfig: Record<MetaTab, { label: string; showDiscards: boolean }> = {
    preview: { label: t('table.tabs.preview'), showDiscards: true },
    leads: { label: t('table.tabs.leads'), showDiscards: false },
    backs: { label: t('table.tabs.backs'), showDiscards: false },
  };

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div>
          <span className="text-sm font-semibold text-surface-300">{t('regulationMeta.title')}</span>
          <span className="ml-2 text-[11px] font-mono bg-surface-800 border border-surface-700 rounded px-1.5 py-px text-surface-400">
            {regulationId}
          </span>
        </div>
        {meta && (
          <span className="text-[11px] text-surface-600">
            {t('regulationMeta.matchCount', { n: meta.totalMatches })}
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <UsageTableTabs
        tabs={META_TABS.map((tabKey) => ({ key: tabKey, label: tabConfig[tabKey].label }))}
        active={tab}
        onChange={setTab}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !meta ? (
        <p className="py-8 text-center text-surface-500 text-sm">{t('regulationMeta.noData')}</p>
      ) : (
        <PokemonUsageTable
          items={tab === 'preview' ? meta.preview : tab === 'leads' ? meta.leads : meta.backs}
          showDiscards={tabConfig[tab].showDiscards}
          tournamentUsageMap={meta.tournamentUsageMap}
        />
      )}
    </div>
  );
}
