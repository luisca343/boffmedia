'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useMatch, useSessions, useMatches } from '@/features/vgc-tracker/hooks/useVgcDb';
import { Spinner } from '@/components/boffmedia/primitives/spinner';
import { MatchWorkspace } from './_components/MatchWorkspace';

interface Props {
  params: Promise<{ sessionId: string; matchId: string }>;
}

export default function MatchPage({ params }: Props) {
  const t = useTranslations('vgc.tracker');
  const { sessionId, matchId } = use(params);
  const { match, loading, save } = useMatch(matchId);
  const { sessions } = useSessions();
  const { remove: removeMatch } = useMatches(sessionId);
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-var(--nav-h,66px))] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="grid h-[calc(100vh-var(--nav-h,66px))] place-items-center font-mono text-[13px] text-txt-muted">
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
