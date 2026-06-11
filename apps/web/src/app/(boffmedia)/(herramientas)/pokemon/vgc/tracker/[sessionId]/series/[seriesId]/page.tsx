'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSingleSeries, useSessions } from '@/features/vgc-tracker/hooks/useVgcDb';
import { SeriesWorkspace } from './_components/SeriesWorkspace';
import { SystemLoading, SystemNotFound } from '@/components/boffmedia/ui/system-states';

interface Props {
  params: Promise<{ sessionId: string; seriesId: string }>;
}

export default function SeriesPage({ params }: Props) {
  const router = useRouter();
  const { sessionId, seriesId } = use(params);
  const { series, loading, save } = useSingleSeries(seriesId);
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return <SystemLoading />;
  }

  if (!series) {
    return <SystemNotFound onHome={() => router.push(`/pokemon/vgc/tracker/${sessionId}`)} />;
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
