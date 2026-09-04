"use client";

/**
 * Sync indicator: shows when local version is newer than cloud.
 *
 * A team's `clientUpdatedAt` (client clock, epoch ms) is compared to `updatedAt`
 * (server timestamp) to detect when a device's local copy is ahead of what the
 * cloud has. This happens when a user edits offline and then comes back online,
 * or when device clocks are out of sync.
 *
 * The indicator warns the user before a merge might overwrite their newer local
 * changes with stale cloud data.
 */

import * as React from "react";
import { Icon } from "@boffmedia/ui";
import { useToolT } from "../i18n";
import { TB_NS } from "./labels";

export interface SyncIndicatorProps {
  clientUpdatedAt: number | null;
  serverUpdatedAt: number;
  className?: string;
}

/**
 * Check if the local copy is newer than the cloud copy.
 * Returns true if clientUpdatedAt (epoch ms) > serverUpdatedAt (as epoch ms).
 */
export function isLocalNewer(clientUpdatedAt: number | null, serverUpdatedAtMs: number): boolean {
  if (clientUpdatedAt === null) return false;
  return clientUpdatedAt > serverUpdatedAtMs;
}

/**
 * Displays a warning icon if the local version is newer.
 * Tooltips explain the sync status.
 */
export function SyncIndicator({
  clientUpdatedAt,
  serverUpdatedAt,
  className = "",
}: SyncIndicatorProps) {
  const t = useToolT(TB_NS);
  const serverMs = new Date(serverUpdatedAt).getTime();
  const isNewer = isLocalNewer(clientUpdatedAt, serverMs);

  if (!isNewer) {
    return null;
  }

  return (
    <div
      className={className}
      title={t("sync.localNewer")}
      role="img"
      aria-label={t("sync.localNewer")}
    >
      <Icon name="alert" size={16} className="text-yellow-500" />
    </div>
  );
}
