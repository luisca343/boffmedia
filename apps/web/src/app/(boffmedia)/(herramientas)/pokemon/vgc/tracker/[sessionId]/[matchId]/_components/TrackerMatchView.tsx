'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useMatch, useSessions, useMatches } from '@/features/vgc-tracker/hooks/useVgcDb';
import { Spinner } from "@boffmedia/ui"
import { MatchWorkspace } from '../_components/MatchWorkspace';

interface Props {
  params: Promise<{ sessionId: string; matchId: string }>;
}

export function TrackerMatchView({ params }: Props) {
  const t = useTranslations('vgc.tracker');
  const { sessionId, matchId } = use(params);
  const { match, loading, save } = useMatch(matchId);
  const { sessions } = useSessions();
  const { remove: removeMatch } = useMatches(sessionId);
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="grid min-h-[calc(100dvh_-_var(--nav-h))] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="grid min-h-[calc(100dvh_-_var(--nav-h))] place-items-center font-mono text-[13px] text-txt-muted">
        {t('workspace.matchNotFound')}
      </div>
    );
  }

  return (
    <MatchWorkspace
      match={match}
      sessionId={sessionId}
      regulationId={session?.regulationId ?? ''}
      onSave={save}
      onDelete={() => removeMatch(matchId)}
    />
  );
}
