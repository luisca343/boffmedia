"use client";

/**
 * The player's teams: local first, synced when there is an account (D10).
 *
 * TWO TIERS, and the split is the whole point:
 *
 *  - `updateLocal` is the editor's autosave. It writes to the tool store and
 *    stops. A team built on a train survives the tunnel, the reload and the
 *    closed tab, with no account and no network, and a debounce firing three
 *    times a second does not put three rows through the outbox.
 *  - `update` is a LIST action (rename from a card, and the paths behind
 *    duplicate/delete/restore): one deliberate act, so it writes locally and
 *    uploads at once. The outbox collapses repeats by `dedupeKey`.
 *  - `syncTeam` is tier 2 on its own — what the editor calls when it closes,
 *    when the idle timer fires and when the player presses Sincronizar. It
 *    reports what the queue was OBSERVED to do; nothing here guesses.
 *
 * Deletes are TOMBSTONES, never row removals. A device that was offline when a
 * team was deleted still has its copy; without a tombstone to tell it, the next
 * sync pushes that copy back and the team returns from the dead.
 */

import { useCallback, useEffect, useState } from "react";
import { exportPaste, importPaste, packTeam, unpackTeam, type TeamRecord } from "@boffmedia/battle-core";
import { useToolSession } from "@boffmedia/tool-kit";

import { getTeam, listTeams } from "../storage";
import { keepTeam, mergeTeamsFromServer, storeTeam, uploadTeam, type TeamSyncResult } from "../sync";

const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `team-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type TeamPatch = Partial<Pick<TeamRecord, "name" | "format" | "packed">>;

export interface UseTeams {
  teams: TeamRecord[];
  loading: boolean;
  create(name: string, format: string, packed?: string): Promise<TeamRecord>;
  /** Tier 1 + tier 2: a deliberate list action, uploaded at once. */
  update(clientId: string, patch: TeamPatch): Promise<void>;
  /** TIER 1 ONLY — the editor's autosave. Local write, no upload, no network. */
  updateLocal(clientId: string, patch: TeamPatch): Promise<void>;
  /** TIER 2 ONLY — queue the stored state of one team and send it now. */
  syncTeam(clientId: string): Promise<TeamSyncResult>;
  /** Tombstones the team and returns what was removed, so a caller can offer Undo. */
  remove(clientId: string): Promise<TeamRecord | null>;
  /** Brings a tombstoned team back — the Undo of `remove`. */
  restore(record: TeamRecord): Promise<void>;
  duplicate(clientId: string): Promise<TeamRecord | null>;
  /** Import a Showdown paste as a new team. Returns null if it does not parse. */
  importFromPaste(name: string, format: string, paste: string): Promise<TeamRecord | null>;
  /** The Showdown paste for a team, for the export button. */
  toPaste(record: TeamRecord): string;
  refresh(): Promise<void>;
}

export function useTeams(): UseTeams {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useToolSession();

  const refresh = useCallback(async () => {
    const rows = await listTeams().catch(() => []);
    setTeams(rows.slice().sort((a, b) => b.updatedAt - a.updatedAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pull the account's teams in on sign-in, then show the merged set. Merging
  // is last-writer-wins on the CLIENT stamp with tombstones winning — see
  // `mergeTeamsFromServer`.
  useEffect(() => {
    if (!session.signedIn) return;
    let alive = true;
    void mergeTeamsFromServer()
      .then((applied) => {
        if (alive && applied > 0) void refresh();
      })
      .catch(() => {
        // Offline or the endpoint is down; the local set is still correct.
      });
    return () => {
      alive = false;
    };
  }, [session.signedIn, refresh]);

  const persist = useCallback(
    async (record: TeamRecord) => {
      await keepTeam(record);
      await refresh();
    },
    [refresh],
  );

  const create = useCallback(
    async (name: string, format: string, packed = "") => {
      const record: TeamRecord = {
        clientId: newClientId(),
        name: name.trim() || "Equipo",
        format,
        packed,
        updatedAt: Date.now(),
      };
      await persist(record);
      return record;
    },
    [persist],
  );

  const update = useCallback(
    async (clientId: string, patch: TeamPatch) => {
      const current = await getTeam(clientId);
      if (!current) return;
      await persist({ ...current, ...patch, updatedAt: Date.now() });
    },
    [persist],
  );

  // The autosave path. `storeTeam`, not `keepTeam`: an upload here would put a
  // row through the outbox on every debounce tick, and the editor is the thing
  // that decides when the account hears about it (on close, on idle, on
  // Sincronizar). The list is refreshed so a card behind the editor is never
  // showing a team the store no longer holds.
  const updateLocal = useCallback(
    async (clientId: string, patch: TeamPatch) => {
      const current = await getTeam(clientId);
      if (!current) return;
      await storeTeam({ ...current, ...patch, updatedAt: Date.now() });
      await refresh();
    },
    [refresh],
  );

  // Uploads whatever is STORED, not a patch handed in: everything the editor
  // has done is already on disk by the time this runs, and re-deriving it from
  // component state would be a second source of truth for the same team.
  const syncTeam = useCallback(async (clientId: string): Promise<TeamSyncResult> => {
    const current = await getTeam(clientId);
    if (!current) return "local-only";
    return uploadTeam(current);
  }, []);

  const remove = useCallback(
    async (clientId: string) => {
      const current = await getTeam(clientId);
      if (!current) return null;
      // Kept, with a stamp. See the header.
      await persist({ ...current, deletedAt: Date.now(), updatedAt: Date.now() });
      return current;
    },
    [persist],
  );

  // A restore is a fresh write with a newer stamp and no tombstone; the merge
  // rule (last CLIENT stamp wins) then carries it over the delete on every
  // other device, which is exactly what "undo" should mean.
  const restore = useCallback(
    async (record: TeamRecord) => {
      await persist({ ...record, deletedAt: undefined, updatedAt: Date.now() });
    },
    [persist],
  );

  const duplicate = useCallback(
    async (clientId: string) => {
      const current = await getTeam(clientId);
      if (!current) return null;
      const copy: TeamRecord = {
        ...current,
        clientId: newClientId(),
        name: `${current.name} (2)`,
        updatedAt: Date.now(),
        deletedAt: undefined,
      };
      await persist(copy);
      return copy;
    },
    [persist],
  );

  const importFromPaste = useCallback(
    async (name: string, format: string, paste: string) => {
      const sets = importPaste(paste);
      if (!sets || !sets.length) return null;
      return create(name, format, packTeam(sets));
    },
    [create],
  );

  const toPaste = useCallback((record: TeamRecord) => {
    const sets = unpackTeam(record.packed);
    return sets ? exportPaste(sets) : "";
  }, []);

  return {
    teams,
    loading,
    create,
    update,
    updateLocal,
    syncTeam,
    remove,
    restore,
    duplicate,
    importFromPaste,
    toPaste,
    refresh,
  };
}
