'use client';

import { use } from 'react';
import { useSingleSeries, useSessions } from '@/features/vgc-tracker/hooks/useVgcDb';
import { SeriesWorkspace } from './_components/SeriesWorkspace';

interface Props {
  params: Promise<{ sessionId: string; seriesId: string }>;
}

export default function SeriesPage({ params }: Props) {
  const { sessionId, seriesId } = use(params);
  const { series, loading, save } = useSingleSeries(seriesId);
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="h-screen bg-surface-900 flex items-center justify-center text-surface-400">
        Series not found.
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
