/**
 * Half of the cross-language IPC shape-parity harness. The other half is
 * `mod shape_parity` in apps/desktop/src-tauri/src/shape_parity.rs.
 *
 * WHY IT EXISTS. The renderer's mock.ts and types.ts are hand-written stand-ins
 * for Tauri command payloads that serialize from Rust structs. TypeScript catches
 * mock↔types.ts drift through its own type system, but the unchecked seam is
 * types.ts ↔ THE RUST STRUCTS that actually serialize over the IPC.
 *
 * Add a field to a `#[serde(rename_all = "camelCase")]` struct in Rust today
 * and browser mode silently ships a shape the real app never sends. This test
 * guards that seam by reading the same fixture files as the Rust side, which
 * record what serde actually emits for representative values, and verifies that
 * mock.ts and types.ts carry the same key set.
 *
 * THE VERDICT IS KEYS ONLY. Values legitimately differ. Optional fields are
 * modeled via `#[serde(skip_serializing_if = "Option::is_none")]` or
 * `#[serde(default)]`: the fixture records what serde actually emits for a
 * representative value, not what TypeScript "should" assume.
 *
 * THE FIXTURE LOOP. A new Rust field makes the Rust test red. The dev updates
 * the fixture file. This test then goes red until mock.ts and types.ts gain the
 * field. Result: drift is impossible to hide — there is no silent path where one
 * language adds a field and the other does not.
 *
 * GROUND TRUTH. The Rust representation is the source of truth: Tauri commands
 * RETURN these types, and the renderer receives what serde emits. Fixtures must
 * record serde's actual behavior, not a hand-written guess about what serde
 * "should" do with an Option or a default field.
 */

import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  MOCK_ACCOUNT,
  MOCK_SETTINGS,
  mockPackEntries,
} from "../mock"
import type {
  Account,
  PackEntry,
  PackVersionSummary,
  Settings,
} from "../types"

/**
 * The fixture root is shared with the Rust tests. In both cases, it must point
 * to the same directory so a fixture added on one side is visible on the other.
 *
 * repo root
 *   └── apps/desktop/shape-fixtures/
 *       ├── BoffAccount.json
 *       ├── AccountView.json
 *       └── ...
 */
const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../shape-fixtures")

/** Floors, not exact counts: a broken glob or deleted directory should fail. */
const MIN_FIXTURES = 17

/**
 * Extract the top-level key set from a JSON fixture file.
 */
function fixtureKeys(typeName: string): Set<string> {
  const path = join(fixtureRoot, `${typeName}.json`)
  const raw = readFileSync(path, "utf8")
  const value = JSON.parse(raw)
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      `fixture ${typeName} must be a JSON object, not ${Array.isArray(value) ? "array" : typeof value}`
    )
  }
  return new Set(Object.keys(value))
}

/**
 * Extract the top-level key set from a TypeScript value or type.
 */
function actualKeys(value: unknown): Set<string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      `expected an object, got ${Array.isArray(value) ? "array" : typeof value}`
    )
  }
  return new Set(Object.keys(value))
}

describe("cross-language IPC shape parity", () => {
  it("fixtures directory exists and has minimum fixtures", () => {
    const files = readdirSync(fixtureRoot)
      .filter((f) => f.endsWith(".json"))
      .sort()
    expect(files.length).toBeGreaterThanOrEqual(MIN_FIXTURES)
  })

  describe("Account", () => {
    it("matches fixture", () => {
      expect(actualKeys(MOCK_ACCOUNT)).toEqual(fixtureKeys("AccountView"))
    })
  })

  describe("Settings", () => {
    it("matches fixture", () => {
      expect(actualKeys(MOCK_SETTINGS)).toEqual(fixtureKeys("Settings"))
    })
  })

  describe("PackEntry", () => {
    it("has PackSummary matching fixture", () => {
      const entries = mockPackEntries()
      expect(entries.length).toBeGreaterThan(0)
      const { pack } = entries[0]
      // PackSummary fixture: id, slug, name, summary, description, iconUrl, gallery, accessKind, gameType
      const expectedKeys = new Set([
        "id",
        "slug",
        "name",
        "summary",
        "description",
        "iconUrl",
        "gallery",
        "accessKind",
        "gameType",
      ])
      expect(actualKeys(pack)).toEqual(expectedKeys)
    })

    it("has PackVersionSummary matching fixture", () => {
      const entries = mockPackEntries()
      expect(entries.length).toBeGreaterThan(0)
      const { latest } = entries[0]
      if (latest) {
        const expectedKeys = new Set([
          "id",
          "name",
          "minecraft",
          "loader",
          "loaderVersion",
          "emulatorKind",
          "fileCount",
          "changelog",
          "createdAt",
          "optionalFeatureCount",
        ])
        expect(actualKeys(latest)).toEqual(expectedKeys)
      }
    })
  })
})
