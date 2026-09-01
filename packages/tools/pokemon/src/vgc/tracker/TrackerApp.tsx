"use client";

/**
 * The tracker's four screens behind one component.
 *
 * On the web these were four routes plus a `layout.tsx`; the layout is the
 * `TrackerSyncProvider` and the floating sync badge, and the routes are the
 * switch below. Both hosts render this same component — apps/web mounts it
 * under each of its routes with the host router wired in, the desktop app
 * mounts it once and lets the memory router carry the path (see `../routing`).
 *
 * Which screen shows is derived from the path rather than held in state, so
 * there is exactly one address for "session X, match Y" and the web's URLs keep
 * meaning what they mean.
 */

import * as React from "react";

import { TrackerSyncProvider } from "../tracker-core/context/TrackerSyncContext";
import { useVgcNav, VgcRoot } from "../routing";
import { SyncStatusBadge } from "./_components/SyncStatusBadge";
import { TrackerHomeView } from "./_components/TrackerHomeView";
import { TrackerSessionView } from "./session/TrackerSessionView";
import { TrackerMatchView } from "./match/TrackerMatchView";
import { TrackerSeriesView } from "./series/TrackerSeriesView";

function TrackerRoutes() {
  const { params } = useVgcNav();
  const { sessionId, matchId, seriesId } = params;

  if (sessionId && seriesId) return <TrackerSeriesView sessionId={sessionId} seriesId={seriesId} />;
  if (sessionId && matchId) return <TrackerMatchView sessionId={sessionId} matchId={matchId} />;
  if (sessionId) return <TrackerSessionView sessionId={sessionId} />;
  return <TrackerHomeView />;
}

export function TrackerApp() {
  return (
    <VgcRoot initialHref="/pokemon/vgc/tracker">
      <TrackerSyncProvider>
        <TrackerRoutes />
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 [&>*]:pointer-events-auto">
          <SyncStatusBadge />
        </div>
      </TrackerSyncProvider>
    </VgcRoot>
  );
}
