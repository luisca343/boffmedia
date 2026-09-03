'use client';

import { useVgcT } from "../../i18n";
import { useSingleSeries, useSessions } from '../../tracker-core/hooks/useVgcDb';
import { Spinner } from "@boffmedia/ui"
import { SeriesWorkspace } from './SeriesWorkspace';

interface Props {
  sessionId: string;
  seriesId: string;
}

export function TrackerSeriesView({ sessionId, seriesId }: Props) {
  const t = useVgcT("tracker");
  const { series, loading, save } = useSingleSeries(seriesId);
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="grid min-h-[var(--tool-vh,100dvh)] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="grid min-h-[var(--tool-vh,100dvh)] place-items-center font-mono text-[0.8125rem] text-txt-muted">
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
