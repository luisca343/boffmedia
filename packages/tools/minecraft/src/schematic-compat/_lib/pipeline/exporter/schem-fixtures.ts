import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Real LittleTiles schematics, used by the three exporter round-trip suites.
 *
 * They live in `docs/schem/`, which `.gitignore` excludes — they are multi-MB
 * binaries saved out of the game, not fixtures anyone would review in a diff.
 * So they exist only on a machine that has them, and the suites that read them
 * must skip rather than fail everywhere else (`describe.skipIf(!hasSchemFixtures)`).
 * The same shape as `check-fonts` skipping itself when `public/` is absent.
 *
 * The three files used to hardcode `/home/luisca/Programacion/Ficus Labs/boffmedia`,
 * which made them unrunnable even on the author's own Windows checkout — the
 * path resolved to `E:\home\luisca\...` and every read was an ENOENT. Walk up
 * to the workspace root instead.
 */
function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const up = dirname(dir)
    if (up === dir) throw new Error("schem-fixtures: no pnpm-workspace.yaml above " + import.meta.url)
    dir = up
  }
  return dir
}

const SCHEM_DIR = join(repoRoot(), "docs", "schem")

/** False on a fresh clone and in CI, where `docs/` was never checked in. */
export const hasSchemFixtures = existsSync(SCHEM_DIR)

/** Reads one schematic as the `File` the loader takes. */
export function schemFixture(name: string): File {
  const bytes = new Uint8Array(readFileSync(join(SCHEM_DIR, name)))
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File
}
