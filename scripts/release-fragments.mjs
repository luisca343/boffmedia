#!/usr/bin/env node
/**
 * Validate and normalize repository changelog fragments for release automation.
 *
 * A fragment is source-controlled editorial input. CI reads these files, sends
 * the normalized payload to the API, and the API atomically claims them for a
 * release. The source files are never edited or deleted by this script.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const FRAGMENTS_DIR = join(ROOT, "changelog", "fragments");
const RELEASE_PLAN = join(ROOT, "release", "plan.json");
const VALID_TYPES = new Set([
  "new",
  "improvement",
  "fix",
  "security",
  "deprecated",
  "removed",
]);
const files = existsSync(FRAGMENTS_DIR)
  ? readdirSync(FRAGMENTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:yaml|yml)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort()
  : [];

function fail(message) {
  console.error(`FAIL -- ${message}`);
  process.exitCode = 1;
}

function requiredString(value, label, file) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${file}: ${label} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, label, file) {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredString(value, label, file);
}

function normalizeFragment(fileName) {
  const absolutePath = join(FRAGMENTS_DIR, fileName);
  const raw = readFileSync(absolutePath);
  const file = `changelog/fragments/${fileName}`;
  const document = parse(raw.toString("utf8"));
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new Error(`${file}: the document must be a YAML object`);
  }

  const id = requiredString(document.id, "id", file);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) {
    throw new Error(
      `${file}: id must contain only letters, numbers, ., _, or -`,
    );
  }
  const type = requiredString(document.type, "type", file);
  if (!VALID_TYPES.has(type)) {
    throw new Error(`${file}: unsupported type ${type}`);
  }
  if (!document.title || typeof document.title !== "object") {
    throw new Error(`${file}: title.en is required`);
  }
  if (!document.description || typeof document.description !== "object") {
    throw new Error(`${file}: description.en is required`);
  }

  const titleEn = requiredString(document.title.en, "title.en", file);
  const descriptionEn = requiredString(
    document.description.en,
    "description.en",
    file,
  );
  const titleEs = optionalString(document.title.es, "title.es", file);
  const descriptionEs = optionalString(
    document.description.es,
    "description.es",
    file,
  );
  if (Boolean(titleEs) !== Boolean(descriptionEs)) {
    throw new Error(
      `${file}: title.es and description.es must be provided together`,
    );
  }
  if (!titleEs) {
    console.warn(`WARN -- ${file}: Spanish translation is not complete`);
  }

  return {
    fragmentId: id,
    sourcePath: file,
    contentHash: createHash("sha256").update(raw).digest("hex"),
    sourceCommitSha:
      process.env.RELEASE_SOURCE_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.GIT_SHA ??
      "unknown",
    type,
    titleEn,
    descriptionEn,
    ...(titleEs && descriptionEs ? { titleEs, descriptionEs } : {}),
  };
}

function validateReleasePlan() {
  let plan;
  try {
    plan = JSON.parse(readFileSync(RELEASE_PLAN, "utf8"));
  } catch (error) {
    throw new Error(
      `release/plan.json is missing or invalid: ${error.message}`,
    );
  }
  if (
    !Array.isArray(plan.requiredSurfaces) ||
    plan.requiredSurfaces.length === 0
  ) {
    throw new Error(
      "release/plan.json: requiredSurfaces must be a non-empty array",
    );
  }
  const invalid = plan.requiredSurfaces.filter(
    (surface) => !["web", "api", "desktop"].includes(surface),
  );
  if (invalid.length > 0) {
    throw new Error(
      `release/plan.json: unsupported required surface(s): ${invalid.join(", ")}`,
    );
  }
  if (new Set(plan.requiredSurfaces).size !== plan.requiredSurfaces.length) {
    throw new Error(
      "release/plan.json: requiredSurfaces must not contain duplicates",
    );
  }
}

try {
  validateReleasePlan();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const fragments = [];
const ids = new Set();
for (const fileName of files) {
  try {
    const fragment = normalizeFragment(fileName);
    if (ids.has(fragment.fragmentId)) {
      throw new Error(`duplicate fragment id ${fragment.fragmentId}`);
    }
    ids.add(fragment.fragmentId);
    fragments.push(fragment);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

if (process.exitCode) process.exit();

if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify({ fragments }, null, 2) + "\n");
} else {
  console.log(`OK -- ${fragments.length} changelog fragment(s) are valid.`);
}
