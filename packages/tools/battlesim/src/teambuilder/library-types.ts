import type { TeamRecord } from "@boffmedia/battle-core";

/** Local library metadata. Kept separate from TeamRecord so existing account
 * sync and older stored teams remain wire-compatible. */
export interface TeamMeta {
  clientId: string;
  favorite?: boolean;
  pinned?: boolean;
  notes?: string;
}

export type LibraryTeam = TeamRecord & TeamMeta;
