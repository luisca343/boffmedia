'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMatch, useSessions, useMatches } from '@/features/vgc-tracker/hooks/useVgcDb';
import { MatchWorkspace } from './_components/MatchWorkspace';
import { SystemLoading, SystemNotFound } from '@/components/boffmedia/ui/system-states';

interface Props {
  params: Promise<{ sessionId: string; matchId: string }>;
}

export default function MatchPage({ params }: Props) {
  const router = useRouter();
  const { sessionId, matchId } = use(params);
  const { match, loading, save } = useMatch(matchId);
  const { sessions } = useSessions();
  const { remove: removeMatch } = useMatches(sessionId);
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return <SystemLoading />;
  }

  if (!match) {
    return <SystemNotFound onHome={() => router.push(`/pokemon/vgc/tracker/${sessionId}`)} />;
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
