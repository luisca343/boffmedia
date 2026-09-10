#!/usr/bin/env node
/**
 * Sync the semantic material glyphs used by the MH Wilds bestiary.
 *
 * Wilds item data identifies an icon by kind and colour. The current public
 * extraction does not contain a standalone material atlas, so this script
 * fetches the matching generic fifth-generation glyphs from zukan-assets.
 * The downloaded source stays under laboon/ and is never committed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const DEFAULT_OUTPUT = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/item-icons",
);
const ITEM_DATA = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/merged/Item.json",
);
const REPOSITORY = "lazywalker/zukan-assets";
const BRANCH = "master";
const TREE_URL = `https://api.github.com/repos/${REPOSITORY}/git/trees/${BRANCH}?recursive=1`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/source/item-icons`;

const KIND_ALIASES = {
  certificate: "ticket",
  medulla: "monster-part",
  gem: "monster-part",
  powder: "sac",
  extract: "sac",
  phial: "bottle",
  plant: "herb",
  mushroom: "mushroom-edible",
  fish: "fish-edible",
  meat: "meat-edible",
  bug: "bug-edible",
  smoke: "smoke-bomb",
  drug: "medicine",
  pill: "pill-edible",
  honey: "nectar",
  voucher: "ticket",
  "ammo-special": "slinger-ammo",
  knife: "slinger-ammo",
  web: "spiderweb",
  "mystery-material": "monster-part",
  "mystery-artian": "monster-part",
  "mystery-decoration": "decoration",
};

// These cover the Wilds item enum plus the generic aliases above. The tree
// query filters out names that the upstream source does not provide.
const BASE_KINDS = [
  "bone",
  "claw",
  "hide",
  "monster-part",
  "ore",
  "scale",
  "shell",
  "skull",
  "tail",
  "wing",
  "ticket",
  "sac",
  "bottle",
  "herb",
  "mushroom-edible",
  "fish-edible",
  "meat-edible",
  "bug-edible",
  "smoke-bomb",
  "medicine",
  "pill-edible",
  "nectar",
  "slinger-ammo",
  "spiderweb",
  "decoration",
  "seed",
  "potion",
  "egg",
  "bomb",
  "barrel",
  "whetstone",
  "trap",
  "coin",
  "nut",
  "mantle",
  "crystal",
  "armor-sphere",
  "question",
  "poop",
  "grill",
  "fishing-rod",
  "binoculars",
  "capture-net",
  "camping-kit",
  "sprout",
  "cooking-cheese",
  "cooking-egg",
  "cooking-garlic",
  "cooking-mushroom",
  "cooking-shellfish",
];

const AVAILABLE_COLORS = [
  "blue",
  "brown",
  "dark-blue",
  "dark-green",
  "dark-purple",
  "dark-red",
  "deep-teal",
  "gold",
  "green",
  "grey",
  "light-brown",
  "light-green",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "white",
  "yellow",
];

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/sync-mhwilds-item-icons.mjs [options]

Options:
  --out <dir>   Ignored source directory for downloaded SVGs
  --dry-run     List matching upstream files without downloading them
  --help        Show this help`);
}

function parseArgs(argv) {
  const args = { out: DEFAULT_OUTPUT, dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--out") {
      const value = argv[++index];
      if (!value || value.startsWith("--"))
        throw new Error("--out requires a value");
      args.out = path.isAbsolute(value)
        ? path.normalize(value)
        : path.resolve(process.cwd(), value);
    } else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function slug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function requestedKinds() {
  const kinds = new Set(BASE_KINDS);
  if (!fs.existsSync(ITEM_DATA)) return kinds;

  const items = JSON.parse(fs.readFileSync(ITEM_DATA, "utf8"));
  for (const item of Array.isArray(items) ? items : []) {
    const rawKind = typeof item.icon === "string" ? item.icon : item.icon?.kind;
    const kind = rawKind ? slug(rawKind) : null;
    if (kind) kinds.add(KIND_ALIASES[kind] ?? kind);
  }
  return kinds;
}

async function getTree() {
  const response = await fetch(TREE_URL, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "boffmedia-mhwilds-assets",
    },
  });
  if (!response.ok)
    throw new Error(`GitHub tree request failed with HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.tree)) throw new Error("GitHub tree response is invalid");
  return payload;
}

function selectFiles(tree, kinds) {
  const colors = [...AVAILABLE_COLORS].sort((a, b) => b.length - a.length);
  return tree
    .filter(
      (entry) =>
        entry.type === "blob" &&
        entry.path.startsWith("source/item-icons/") &&
        entry.path.toLowerCase().endsWith(".svg"),
    )
    .map((entry) => {
      const filename = path.posix.basename(entry.path);
      const stem = filename.slice(0, -4);
      const color = colors.find((candidate) => stem.endsWith(`-${candidate}`));
      if (!color) return null;
      const kind = stem.slice(0, -(color.length + 1));
      if (!kinds.has(kind)) return null;
      return {
        filename,
        kind,
        color,
        sha: entry.sha,
        url: `${RAW_ROOT}/${encodeURIComponent(filename)}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

async function downloadFiles(files, output) {
  fs.mkdirSync(output, { recursive: true });
  let completed = 0;
  const worker = async () => {
    while (completed < files.length) {
      const file = files[completed++];
      const response = await fetch(file.url, {
        headers: { "user-agent": "boffmedia-mhwilds-assets" },
      });
      if (!response.ok)
        throw new Error(`${file.filename} failed with HTTP ${response.status}`);
      fs.writeFileSync(
        path.join(output, file.filename),
        Buffer.from(await response.arrayBuffer()),
      );
    }
  };
  await Promise.all(Array.from({ length: 8 }, () => worker()));
}

try {
  const args = parseArgs(process.argv.slice(2));
  const kinds = requestedKinds();
  const tree = await getTree();
  const files = selectFiles(tree.tree, kinds);
  console.log(
    `[sync-mhwilds-item-icons] matching=${files.length} kinds=${kinds.size} tree=${tree.sha}`,
  );
  if (args.dryRun) {
    for (const file of files) console.log(`  ${file.filename}`);
    process.exit(0);
  }

  await downloadFiles(files, args.out);
  fs.writeFileSync(
    path.join(args.out, "_source.json"),
    `${JSON.stringify(
      {
        repository: `https://github.com/${REPOSITORY}`,
        sourceDirectory: "source/item-icons",
        commit: tree.sha,
        license: "CC BY-SA (see upstream source/item-icons/README.md)",
        files,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`[sync-mhwilds-item-icons] wrote ${files.length} SVGs to ${args.out}`);
} catch (error) {
  console.error(
    `[sync-mhwilds-item-icons] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  process.exitCode = 1;
}
