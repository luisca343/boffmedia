'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useSingleSeries, useSessions } from '@/features/vgc-tracker/hooks/useVgcDb';
import { Spinner } from "@boffmedia/ui"
import { SeriesWorkspace } from './_components/SeriesWorkspace';

interface Props {
  params: Promise<{ sessionId: string; seriesId: string }>;
}

export default function SeriesPage({ params }: Props) {
  const t = useTranslations('vgc.tracker');
  const { sessionId, seriesId } = use(params);
  const { series, loading, save } = useSingleSeries(seriesId);
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh_-_var(--nav-h,66px))] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="grid h-[calc(100vh_-_var(--nav-h,66px))] place-items-center font-mono text-[13px] text-txt-muted">
        {t('workspace.seriesNotFound')}
      </div>
    );
  }

  return (
    <SeriesWorkspace
      series={series}
      sessionId={sessionId}
      regulationId={session?.regulationId ?? ''}
      onSave={save}
    />
  );
}
