import {
  exportPaste,
  unpackTeam,
  type TeamRecord,
} from "@boffmedia/battle-core";
import { getBuilderTeam, listBuilderTeams } from "../../teambuilder/storage";
import type { PresetSlot, TeamPreset } from "./types";

function toPreset(team: TeamRecord): TeamPreset | null {
  try {
    const sets = team.packed ? unpackTeam(team.packed) : null;
    if (!sets?.length) return null;

    const slots: PresetSlot[] = sets.map((set, index) => ({
      slotIndex: index as PresetSlot["slotIndex"],
      speciesId: set.species,
      speciesName: set.species,
      item: set.item || undefined,
      ability: set.ability || undefined,
      moves: set.moves.filter(Boolean),
      nature: set.nature || undefined,
      teraType: set.teraType || undefined,
    }));

    return {
      id: team.clientId,
      name: team.name,
      regulationId: team.format,
      exportString: exportPaste(sets),
      slots,
      createdAt: team.updatedAt,
      updatedAt: team.updatedAt,
      currentVersion: 1,
      versions: [],
    };
  } catch {
    // A malformed local team must not hide every other usable team from the
    // tracker. The teambuilder remains responsible for repairing or deleting it.
    return null;
  }
}

/** Read-only adapter: tracker sessions can select teams made in teambuilder. */
export async function listBuilderPresets(): Promise<TeamPreset[]> {
  const teams = await listBuilderTeams();
  return teams
    .map(toPreset)
    .filter((preset): preset is TeamPreset => preset !== null);
}

export async function getBuilderPreset(id: string): Promise<TeamPreset | null> {
  const team = await getBuilderTeam(id);
  return team ? toPreset(team) : null;
}
