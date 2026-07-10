import * as React from 'react';
import { useBoffSession } from '@/services/useBoffSession';
import { ForumService } from '@/services/api/boffmedia/forumService';

// Marks the logged-in viewer as present while they are on a forum page: pings
// once on mount and every 60s. Anonymous viewers never ping (the endpoint is
// JWT-guarded). Failures are swallowed — presence is best-effort.
const PING_INTERVAL_MS = 60_000;

export function useForumPresence() {
  const { status } = useBoffSession();

  React.useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const ping = () => {
      ForumService.pingPresence().catch(() => {});
    };
    ping();
    const id = setInterval(() => {
      if (active) ping();
    }, PING_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [status]);
}
