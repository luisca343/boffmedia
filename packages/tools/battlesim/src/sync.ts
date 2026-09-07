"use client";

/**
 * Local-first sync for replays and teams (D7, D10).
 *
 * Everything is written to the tool store FIRST and unconditionally — a battle
 * played with no account and no network still leaves a replay, which is the
 * whole point of the offline story. Uploading is a second, optional step that
 * happens only when there is a session, and it goes through the kit's outbox so
 * a flaky connection retries instead of losing the row.
 *
 * WHY EVERY OP CARRIES A `dedupeKey`: the outbox collapses superseded writes
 * that share one, and each of these PUTs sends the WHOLE final state of one
 * document. A team edited five times offline therefore uploads once, with the
 * last version. That is only safe because none of these ops is an increment —
 * an "add one" op deduped this way would silently lose writes.
 */

import {
  toolApi,
  toolSession,
  type ToolFlushResult,
  type ToolSyncState,
} from "@boffmedia/tool-kit";
import type { ReplayRecord, TeamRecord } from "@boffmedia/battle-core";

import { battlesimOutbox, getTeamMeta, listTeams, saveReplay, saveTeam, saveTeamMeta } from "./storage";

/** Whether an account is attached right now. */
function signedIn(): boolean {
  try {
    return toolSession().status() === "signed-in";
  } catch {
    // No host configured (server render, tests). Local-only is the safe answer.
    return false;
  }
}

// ── replays ─────────────────────────────────────────────────────────────────

/**
 * Stores a finished battle and queues it for upload.
 *
 * Returns once the LOCAL write is done; the upload is the outbox's problem.
 */
export async function keepReplay(record: ReplayRecord): Promise<void> {
  await saveReplay(record);
  if (!signedIn()) return;

  await battlesimOutbox().enqueue({
    method: "PUT",
    path: `/battlesimulator/replays/${encodeURIComponent(record.id)}`,
    body: {
      clientId: record.id,
      format: record.format,
      p1Name: record.p1,
      p2Name: record.p2,
      winner: record.winner,
      log: record.log,
      teams: record.teams ? JSON.stringify(record.teams) : undefined,
      source: record.source,
      playedAt: record.playedAt,
    },
    // One replay, one row. A retry must not create a second.
    dedupeKey: `replay:${record.id}`,
  });
}

interface ServerReplay {
  id: string;
  clientId: string;
  format: string;
  p1Name: string;
  p2Name: string;
  winner: string | null;
  playedAt: number;
  source: string;
}

/**
 * The caller's replays as the server has them — their own uploads plus any PvP
 * battle they took part in, including ones played on another device.
 *
 * Returns null rather than throwing when there is no session or no network: the
 * Replays tab falls back to what is on this device, which is not an error state.
 */
export async function fetchServerReplays(limit = 50): Promise<ServerReplay[] | null> {
  if (!signedIn()) return null;
  try {
    const response = await toolApi().request<{ data?: { items?: ServerReplay[] } }>(
      "/battlesimulator/replays",
      { query: { limit }, auth: "required" },
    );
    return response?.data?.items ?? [];
  } catch {
    return null;
  }
}

// ── teams ───────────────────────────────────────────────────────────────────

/**
 * What an upload attempt was OBSERVED to do — never what it hoped to do.
 *
 * The editor puts this on screen, so every value has to be something the
 * outbox actually told us. `"synced"` is only returned when this team's row
 * left the queue through a request that came back OK; anything still queued is
 * `"queued"`, and a row the server refused for good is `"rejected"` (it is
 * gone from the queue and was never applied).
 *
 * T5. Derived from the kit's vocabulary rather than written out again, so
 * renaming a member there is a compile error here instead of a silent drift.
 *
 * `"offline"` was the fifth member and is gone. It reported that the network
 * was not there -- a CAUSE, not an outcome. The outcome is identical to
 * `"queued"`: the row is in the outbox either way, and the kit's own rule is
 * that offline work is `queued` and never `retrying`, precisely because there
 * is no attempt to count down to. Two words for one state is how a vocabulary
 * drifts, and the VGC tracker had the mirror image of the same fault -- it used
 * `offline` for SIGNED OUT, which this file has always called `local-only`. One
 * word, two meanings, in two files meant to agree with each other.
 */
export type TeamSyncResult = Extract<
  ToolSyncState,
  "synced" | "queued" | "rejected" | "local-only"
>;

const teamPath = (clientId: string) => `/battlesimulator/teams/${encodeURIComponent(clientId)}`;

/** The outbox row for one team. Keyed on the team, so a save then a delete collapses to the delete. */
export const teamDedupeKey = (clientId: string) => `team:${clientId}`;

/**
 * TIER 1 — the local write, alone.
 *
 * This is what the editor's autosave calls on every keystroke-ish change. It
 * touches no network and queues nothing: a debounce running three times a
 * second must not put three rows through the outbox, and work has to survive a
 * closed tab whether or not there is an account.
 */
export async function storeTeam(record: TeamRecord): Promise<void> {
  await saveTeam(record);
}

/**
 * TIER 2a — queue the whole final state of one team for the account.
 *
 * Returns false when there is nobody to upload to, which is not an error: a
 * signed-out player's teams are complete on this device.
 */
export async function queueTeamUpload(record: TeamRecord): Promise<boolean> {
  if (!signedIn()) return false;

  const meta = await getTeamMeta(record.clientId);

  await battlesimOutbox().enqueue({
    // Deletes are PUT tombstones too. A bare DELETE has no client timestamp,
    // so another device can legitimately resurrect an older copy.
    method: "PUT",
    path: teamPath(record.clientId),
    body: {
      clientId: record.clientId,
      name: record.name,
      format: record.format,
      packed: record.packed,
      tags: record.tags ?? [],
      favorite: meta?.favorite ?? false,
      pinned: meta?.pinned ?? false,
      notes: meta?.notes ?? null,
      clientUpdatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? null,
    },
    // Keyed on the team, not the operation: a save followed by a delete
    // collapses to the delete, which is the correct final state.
    dedupeKey: teamDedupeKey(record.clientId),
  });
  return true;
}

/**
 * TIER 2b — replay the queue and report what happened to THIS team's row.
 *
 * The web outbox never sends on its own except when the connection returns, so
 * without this call a queued team sits on the device forever. The report is
 * read back off the queue rather than assumed: `flush` stops at the first row
 * it cannot send (they are ordered writes), so a replay failing ahead of us
 * leaves our team queued and that is what the chip has to say.
 */
export async function flushTeamUploads(clientId: string): Promise<TeamSyncResult> {
  if (!signedIn()) return "local-only";

  const outbox = battlesimOutbox();
  let result: ToolFlushResult;
  try {
    result = await outbox.flush();
  } catch {
    // The flush threw, so nothing left the queue: still owed, still `queued`.
    return "queued";
  }

  if (result.rejected.some((r) => r.path === teamPath(clientId))) return "rejected";

  let stillQueued: boolean;
  try {
    stillQueued = (await outbox.pending()).some((op) => op.dedupeKey === teamDedupeKey(clientId));
  } catch {
    // The queue could not be read back, so "it went" is not something we know.
    return "queued";
  }
  if (stillQueued) return "queued";
  return "synced";
}

/** TIER 2, both halves: queue this team, then send. */
export async function uploadTeam(record: TeamRecord): Promise<TeamSyncResult> {
  if (!(await queueTeamUpload(record))) return "local-only";
  return flushTeamUploads(record.clientId);
}

/**
 * Local write AND upload — the pair the LIST still wants.
 *
 * Rename from a card, duplicate, delete and restore are discrete deliberate
 * acts with no editor around them to flush later, so they go out at once; the
 * outbox collapses repeats by `dedupeKey`. The send is fire-and-forget because
 * the local write is what the caller is waiting on.
 */
export async function keepTeam(record: TeamRecord): Promise<void> {
  await storeTeam(record);
  if (!(await queueTeamUpload(record))) return;
  void flushTeamUploads(record.clientId).catch(() => {
    // Still queued; the next flush or the host's `online` replay takes it.
  });
}

interface ServerTeam {
  clientId: string;
  name: string;
  format: string;
  packed: string;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  notes?: string | null;
  clientUpdatedAt: number | null;
  deletedAt: number | null;
}

/**
 * Merges the account's teams into this device on sign-in.
 *
 * Last-writer-wins on the CLIENT stamp, and a tombstone always wins: those two
 * rules together are what stop a device that was offline during a delete from
 * resurrecting the row on its next sync.
 */
export async function mergeTeamsFromServer(): Promise<number> {
  if (!signedIn()) return 0;

  let remote: ServerTeam[];
  try {
    // NOT `data.items`: unlike the paginated replay list, this endpoint returns
    // the teams as a BARE ARRAY under the envelope's `data`. Reading `.items`
    // here made every merge silently see zero teams — a sync that reported
    // success and applied nothing.
    const response = await toolApi().request<{ data?: ServerTeam[] }>(
      "/battlesimulator/teams",
      { auth: "required" },
    );
    remote = Array.isArray(response?.data) ? response.data : [];
  } catch {
    return 0;
  }

  const local = new Map((await listTeams(true)).map((t) => [t.clientId, t]));
  let applied = 0;

  for (const row of remote) {
    const mine = local.get(row.clientId);
    const theirStamp = Math.max(row.deletedAt ?? 0, row.clientUpdatedAt ?? 0);
    const myStamp = mine ? Math.max(mine.deletedAt ?? 0, mine.updatedAt) : -1;
    if (mine && myStamp >= theirStamp) continue;

    await saveTeam({
      clientId: row.clientId,
      name: row.name,
      format: row.format,
      packed: row.packed,
      tags: row.tags ?? [],
      updatedAt: row.clientUpdatedAt ?? Date.now(),
      clientUpdatedAt: row.clientUpdatedAt,
      ...(row.deletedAt ? { deletedAt: row.deletedAt } : {}),
    });
    await saveTeamMeta({
      clientId: row.clientId,
      ...(row.favorite === undefined ? {} : { favorite: row.favorite }),
      ...(row.pinned === undefined ? {} : { pinned: row.pinned }),
      ...(row.notes === undefined ? {} : { notes: row.notes ?? undefined }),
    });
    applied++;
  }
  return applied;
}
