'use client';

import { use } from 'react';
import { useMatch, useSessions, useMatches } from '@/features/vgc-tracker/hooks/useVgcDb';
import { MatchWorkspace } from './_components/MatchWorkspace';

interface Props {
  params: Promise<{ sessionId: string; matchId: string }>;
}

export default function MatchPage({ params }: Props) {
  const { sessionId, matchId } = use(params);
  const { match, loading, save } = useMatch(matchId);
  const { sessions } = useSessions();
  const { remove: removeMatch } = useMatches(sessionId);
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="h-screen bg-surface-950 flex items-center justify-center text-surface-400">
        Match not found.
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
