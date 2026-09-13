import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const publicRoot = path.join(
  repoRoot,
  "public",
  "boffmedia",
  "tools",
  "mhwilds",
);
const armorSourcePath = path.join(publicRoot, "en", "armor.json");
const rawArmorPath = path.join(
  repoRoot,
  "laboon",
  "tool-sources",
  "mhwilds",
  "mhdb-wilds-data",
  "output",
  "merged",
  "Armor.json",
);

const armor = JSON.parse(fs.readFileSync(armorSourcePath, "utf8"));
const rawArmor = JSON.parse(fs.readFileSync(rawArmorPath, "utf8"));
const rawByName = new Map(
  rawArmor
    .filter((record) => record?.names?.en != null && record.game_id != null)
    .map((record) => [record.names.en, record]),
);

const sets = new Map();
for (const piece of armor) {
  const armorSet = piece?.armorSet;
  if (armorSet?.id == null || armorSet.name == null) continue;
  const rawSet = rawByName.get(armorSet.name);
  if (!rawSet) {
    throw new Error(`No raw game id found for armor set ${armorSet.name}`);
  }
  const apiId = String(armorSet.id);
  const existing = sets.get(apiId);
  if (existing && String(existing.gameId) !== String(rawSet.game_id)) {
    throw new Error(
      `Conflicting game ids found for armor set ${armorSet.name}`,
    );
  }
  sets.set(apiId, {
    id: armorSet.id,
    gameId: rawSet.game_id,
  });
}

const crosswalk = [...sets.values()].sort(
  (left, right) => Number(left.id) - Number(right.id),
);
for (const locale of ["en", "es"]) {
  const outputPath = path.join(publicRoot, locale, "armor-sets.json");
  fs.writeFileSync(`${outputPath}`, `${JSON.stringify(crosswalk, null, 2)}\n`);
}

console.log(
  `Wrote ${crosswalk.length} MH Wilds armor-set identity records for en/es`,
);
