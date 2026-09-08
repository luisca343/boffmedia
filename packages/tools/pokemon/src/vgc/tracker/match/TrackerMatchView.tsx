'use client';

import { useVgcT } from "../../i18n";
import { useMatch, useSessions, useMatches, usePreset } from '../../tracker-core/hooks/useVgcDb';
import { Spinner } from "@boffmedia/ui"
import { MatchWorkspace } from './MatchWorkspace';

interface Props {
  sessionId: string;
  matchId: string;
}

export function TrackerMatchView({ sessionId, matchId }: Props) {
  const t = useVgcT("tracker");
  const { match, loading, save } = useMatch(matchId);
  const { sessions } = useSessions();
  const { remove: removeMatch } = useMatches(sessionId);
  const teamPreset = usePreset(match?.myTeam.presetId ?? null);
  const session = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="grid min-h-[var(--tool-vh,100dvh)] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="grid min-h-[var(--tool-vh,100dvh)] place-items-center font-mono text-[0.8125rem] text-txt-muted">
        {t('workspace.matchNotFound')}
      </div>
    );
  }

  return (
    <MatchWorkspace
      match={match}
      sessionId={sessionId}
      regulationId={session?.regulationId ?? ''}
      teamPreset={teamPreset}
      onSave={save}
      onDelete={() => removeMatch(matchId)}
    />
  );
}
