import {
  exportPaste,
  importPaste,
  packTeam,
  unpackTeam,
  type TeamRecord,
} from "@boffmedia/battle-core";
import { toolDb } from "@boffmedia/tool-kit";
import {
  getBuilderTeam,
  listBuilderTeams,
  mergeBuilderTeamsFromServer,
} from "../../teambuilder/storage";
import type { PresetSlot, TeamPreset } from "./types";

const LEGACY_TRACKER_STORE = "pokemon.vgc-tracker";
const LEGACY_PRESET_COLLECTION = "presets";
let legacyMigration: Promise<void> | null = null;

/** Move usable offline presets into the canonical teambuilder shelf once. */
async function migrateLegacyPresets(): Promise<void> {
  const legacy = toolDb(LEGACY_TRACKER_STORE);
  const target = toolDb("pokemon.battlesim");
  const rows = await legacy.list<TeamPreset>(LEGACY_PRESET_COLLECTION);

  for (const row of rows) {
    const existing = await target.get<TeamRecord>("teams", row.id);
    if (!existing) {
      const sets = importPaste(row.value.exportString);
      if (!sets?.length) continue;
      await target.put("teams", row.id, {
        clientId: row.id,
        name: row.value.name,
        format: row.value.regulationId,
        packed: packTeam(sets),
        updatedAt: row.value.updatedAt,
      });
    }
    await legacy.remove(LEGACY_PRESET_COLLECTION, row.id);
  }
}

function ensureLegacyMigration(): Promise<void> {
  legacyMigration ??= migrateLegacyPresets().catch(() => undefined);
  return legacyMigration;
}

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
  await ensureLegacyMigration();
  await mergeBuilderTeamsFromServer();
  const teams = await listBuilderTeams();
  return teams
    .map(toPreset)
    .filter((preset): preset is TeamPreset => preset !== null);
}

export async function getBuilderPreset(id: string): Promise<TeamPreset | null> {
  await ensureLegacyMigration();
  const team = await getBuilderTeam(id);
  return team ? toPreset(team) : null;
}
