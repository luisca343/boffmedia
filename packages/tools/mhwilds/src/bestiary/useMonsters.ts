import { useEffect, useState } from "react";
import { useLocale, useToolT } from "../i18n";
import { MhWildsService } from "../service";
import { mhwildsBestiaryAsset, mhwildsManifestAsset } from "./assets";
import {
  ANATOMY_SLOT_ANCHORS,
  anatomyCalloutTarget,
} from "./anatomy-geometry";
import type {
  MhMonster,
  MhMonsterWeakness,
  MhWildsAnatomyOverride,
  MhWildsBestiaryData,
  MhWildsMonsterVariant,
} from "../types";

interface LocalBestiaryPayload {
  data: MhWildsBestiaryData;
  version?: string;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function indexLocalVariants(data: MhWildsBestiaryData): {
  byFixedId: Map<number, MhWildsMonsterVariant>;
  byName: Map<string, MhWildsMonsterVariant>;
} {
  const byFixedId = new Map<number, MhWildsMonsterVariant>();
  const byName = new Map<string, MhWildsMonsterVariant>();
  for (const monster of data.monsters) {
    for (const variant of monster.variants) {
      if (variant.identity?.fixedId != null)
        byFixedId.set(variant.identity.fixedId, variant);
      for (const name of Object.values(variant.identity?.names ?? {})) {
        if (name) byName.set(normalizeName(name), variant);
      }
    }
  }
  return { byFixedId, byName };
}

function weaknessKey(weakness: MhMonsterWeakness): string {
  return [
    weakness.kind,
    weakness.element ?? "",
    weakness.status ?? "",
    weakness.effect ?? "",
  ].join(":");
}

function localWeaknessId(monsterId: number, element: string): number {
  // Keep generated rows stable without pretending they are API/database IDs.
  let hash = 2166136261;
  for (const character of `${monsterId}:${element}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return -Math.max(1, hash >>> 0);
}

function mergeWeaknesses(
  monster: MhMonster,
  localData: MhWildsMonsterVariant,
): MhMonsterWeakness[] {
  const apiWeaknesses = Array.isArray(monster.weaknesses)
    ? monster.weaknesses
    : [];
  const gameWeaknesses = (localData.report?.elementalWeaknesses ?? []).map(
    ({ element, level }) => ({
      kind: "element",
      element,
      level,
      condition: null,
      id: localWeaknessId(monster.id, element),
    }),
  );
  const merged = new Map<string, MhMonsterWeakness>();
  for (const weakness of [...apiWeaknesses, ...gameWeaknesses])
    merged.set(weaknessKey(weakness), weakness);

  // Some game reports do not set an element flag even though the in-game
  // recommendation identifies the elements to use. Only use that bitmask if
  // neither the API nor EnemyWeakAttrData supplied an elemental row. This is
  // what makes Gogmazios work without hardcoding its name or ID.
  const hasElementalWeakness = [...merged.values()].some(
    (weakness) => weakness.kind === "element",
  );
  if (!hasElementalWeakness) {
    for (const element of localData.report?.recommendedElements ?? []) {
      const weakness: MhMonsterWeakness = {
        kind: "element",
        element,
        level: 1,
        condition: null,
        id: localWeaknessId(monster.id, `recommended:${element}`),
      };
      merged.set(weaknessKey(weakness), weakness);
    }
  }
  return [...merged.values()];
}

function applyAnatomyOverrides(
  variant: MhWildsMonsterVariant,
  overrides: MhWildsAnatomyOverride[],
): MhWildsMonsterVariant {
  const fixedId = variant.identity?.fixedId;
  if (fixedId == null || !variant.report?.anatomyLayout) return variant;
  const override = overrides.find(
    (item) => item.fixedId === fixedId && item.variantId === variant.id,
  );
  if (!override) return variant;

  const targets = new Map(
    override.callouts.map((callout) => [callout.slotKey, callout.target]),
  );
  if (targets.size === 0) return variant;

  return {
    ...variant,
    report: {
      ...variant.report,
      anatomyLayout: {
        ...variant.report.anatomyLayout,
        slots: variant.report.anatomyLayout.slots.map((slot) => {
          const target = targets.get(slot.key);
          if (!target) return slot;
          const generated = anatomyCalloutTarget(slot);
          const anchor = generated?.anchor ?? ANATOMY_SLOT_ANCHORS[slot.key];
          if (!anchor) return slot;
          return {
            ...slot,
            callout: { anchor, target },
          };
        }),
      },
    },
  };
}

function joinLocalData(
  monsters: MhMonster[],
  payload: LocalBestiaryPayload | null,
  overrides: MhWildsAnatomyOverride[] = [],
): MhMonster[] {
  if (!payload) return monsters;
  const { byFixedId, byName } = indexLocalVariants(payload.data);
  return monsters.map((monster) => {
    const localData =
      (monster.gameId != null ? byFixedId.get(monster.gameId) : undefined) ??
      byName.get(normalizeName(monster.name));
    if (!localData) return monster;
    const correctedLocalData = applyAnatomyOverrides(localData, overrides);
    return {
      ...monster,
      localData: correctedLocalData,
      localAssetVersion: payload.version,
      weaknesses: mergeWeaknesses(monster, correctedLocalData),
    };
  });
}

async function getLocalBestiaryData(): Promise<LocalBestiaryPayload | null> {
  try {
    const manifestResponse = await fetch(mhwildsManifestAsset(), {
      cache: "no-store",
    });
    if (!manifestResponse.ok)
      throw new Error(`Manifest HTTP ${manifestResponse.status}`);
    const manifest = (await manifestResponse.json()) as { version?: string };
    const response = await fetch(
      mhwildsBestiaryAsset("bestiary-data.json", manifest.version),
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return {
      data: (await response.json()) as MhWildsBestiaryData,
      version: manifest.version,
    };
  } catch (error) {
    // The API remains a useful fallback if the generated asset tree has not
    // been built on a developer machine or has not been published yet.
    console.warn("[mhwilds-bestiary] local game data unavailable", error);
    return null;
  }
}

export function useMonsters() {
  const locale = useLocale();
  const t = useToolT("tools.mhwilds.bestiary");
  const [monsters, setMonsters] = useState<MhMonster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const [res, localData, overrideResponse] = await Promise.all([
        MhWildsService.getMonsters(locale),
        getLocalBestiaryData(),
        MhWildsService.getAnatomyOverrides(),
      ]);
      if (!res.data) throw new Error("No data received from monsters API");
      const overrides =
        overrideResponse.success && Array.isArray(overrideResponse.data)
          ? overrideResponse.data
          : [];
      setMonsters(
        joinLocalData(
          Array.isArray(res.data) ? res.data : [],
          localData,
          overrides,
        ),
      );
      setError(null);
    } catch (err) {
      console.error("Error fetching monsters:", err);
      setError(t("errorLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonsters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return { monsters, loading, error, refresh: fetchMonsters };
}
