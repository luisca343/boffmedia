import { toolDb } from "@boffmedia/tool-kit";
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
  return toolDb(TEAM_BUILDER_STORE).get<TeamRecord>(TEAM_COLLECTION, clientId);
}
