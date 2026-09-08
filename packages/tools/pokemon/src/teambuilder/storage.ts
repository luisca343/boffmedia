import { toolApi, toolDb, toolSession } from "@boffmedia/tool-kit";
import type { TeamRecord } from "@boffmedia/battle-core";

/** Shared team shelf used by the teambuilder and every consumer of its teams. */
export const TEAM_BUILDER_STORE = "pokemon.battlesim";
export const TEAM_COLLECTION = "teams";

export async function listBuilderTeams(): Promise<TeamRecord[]> {
  const docs =
    await toolDb(TEAM_BUILDER_STORE).list<TeamRecord>(TEAM_COLLECTION);
  return docs.map((doc) => doc.value).filter((team) => !team.deletedAt);
}

export async function getBuilderTeam(
  clientId: string,
): Promise<TeamRecord | null> {
  const team = await toolDb(TEAM_BUILDER_STORE).get<TeamRecord>(
    TEAM_COLLECTION,
    clientId,
  );
  return team && !team.deletedAt ? team : null;
}

/** Pull canonical teams for consumers that open without mounting Battlesim. */
export async function mergeBuilderTeamsFromServer(): Promise<number> {
  try {
    if (toolSession().status() !== "signed-in") return 0;
    const response = await toolApi().request<{
      data?: Array<{
        clientId: string;
        name: string;
        format: string;
        packed: string;
        tags?: string[];
        clientUpdatedAt?: number | null;
        deletedAt?: number | null;
      }>;
    }>("/battlesimulator/teams", { auth: "required" });
    const remote = Array.isArray(response?.data) ? response.data : [];
    const db = toolDb(TEAM_BUILDER_STORE);
    const local = new Map(
      (await db.list<TeamRecord>(TEAM_COLLECTION)).map((doc) => [doc.id, doc.value]),
    );
    let applied = 0;

    for (const row of remote) {
      const current = local.get(row.clientId);
      const remoteStamp = Math.max(row.deletedAt ?? 0, row.clientUpdatedAt ?? 0);
      const localStamp = current ? Math.max(current.deletedAt ?? 0, current.updatedAt) : -1;
      if (current && localStamp >= remoteStamp) continue;
      await db.put(TEAM_COLLECTION, row.clientId, {
        clientId: row.clientId,
        name: row.name,
        format: row.format,
        packed: row.packed,
        tags: row.tags ?? [],
        updatedAt: row.clientUpdatedAt ?? Date.now(),
        clientUpdatedAt: row.clientUpdatedAt,
        ...(row.deletedAt ? { deletedAt: row.deletedAt } : {}),
      } satisfies TeamRecord);
      applied += 1;
    }
    return applied;
  } catch {
    return 0;
  }
}
