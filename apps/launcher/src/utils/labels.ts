import type { InstallPhase } from "../services/types"

// Shared by the library cards and the detail screen. One table, because two
// copies drift and the player then sees a different name for the same phase
// depending on which screen they happen to be looking at.

export const PHASE_LABEL: Record<InstallPhase, string> = {
  resolving: "Resolviendo versión",
  java: "Comprobando Java",
  libraries: "Librerías",
  assets: "Assets",
  loader: "Mod loader",
  mods: "Mods",
  overrides: "Configuración",
  verifying: "Verificando",
}

// Rust reports eight fine-grained phases; the user gets four. Eight steps is
// both too granular to be meaningful and too wide for the content area — the
// Stepper hides its labels below a 1100px *viewport*, which never triggers here
// because the 228px sidebar eats the space instead.
export const STEP_GROUPS: { label: string; phases: InstallPhase[] }[] = [
  { label: "Preparando", phases: ["resolving", "java"] },
  { label: "Descargando", phases: ["libraries", "assets"] },
  { label: "Instalando", phases: ["loader", "mods", "overrides"] },
  { label: "Verificando", phases: ["verifying"] },
]

/** The registry stores the loader under its dependency key, which is also what
 *  the version JSON uses; these are just the display names. */
export const LOADER_LABEL: Record<string, string> = {
  neoforge: "NeoForge",
  forge: "Forge",
  "fabric-loader": "Fabric",
  quilt: "Quilt",
}
