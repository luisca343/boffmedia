'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RegulationMeta } from '@/features/vgc-tracker/hooks/useRegulationMeta';
import { PokemonUsageTable } from './PokemonUsageTable';

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
      <div className="flex border-b border-surface-800">
        {META_TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === tabKey
                ? 'text-primary-400 border-b-2 border-primary-400 -mb-px bg-primary-500/5'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {t(`table.tabs.${tabKey}`)}
          </button>
        ))}
      </div>

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
          showDiscards={tab === 'preview'}
        />
      )}
    </div>
  );
}
