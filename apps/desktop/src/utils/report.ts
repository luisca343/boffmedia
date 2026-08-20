import type { GameState, LogLine, PackEntry, Settings } from "../services/types"
import type { RuntimeInfo } from "../runtime"
import { formatClock } from "./format"

// A copy-paste support bundle. The raw log alone loses the one thing whoever
// reads it needs first — which
// launcher, which pack, which Java, and what the crash classifier already
// concluded. This assembles all of that above a bounded log tail so a player
// can paste ONE block into a chat instead of a screenshot of a wall of text.

/** How many trailing log lines the bundle carries. The store keeps ~2000; a
 *  paste that large is unreadable, and the diagnosis evidence already points at
 *  the lines that matter. The tail is context around them, not the whole run. */
const TAIL_LINES = 300

const GAME_STATE_LABEL: Record<GameState["kind"], string> = {
  idle: "sin ejecutar",
  preparing: "preparando",
  running: "en ejecución",
  crashed: "cerrado con error",
}

function packLine(pack: PackEntry | null): string {
  if (!pack) return "Pack: (ninguno seleccionado)"
  const v = pack.latest
  const loader = v?.loader ? `${v.loader} ${v.loaderVersion ?? ""}`.trim() : "vanilla"
  const mc = v ? `MC ${v.minecraft}` : "sin versión publicada"
  return `Pack: ${pack.pack.name} [${pack.origin}] · ${mc} · ${loader} · instalación ${pack.state.kind}`
}

function diagnosisBlock(game: GameState): string[] {
  if (game.kind !== "crashed") return []
  const out = [`Estado del juego: ${GAME_STATE_LABEL.crashed} (código ${game.exitCode})`]
  if (game.diagnosis) {
    const d = game.diagnosis
    out.push(`Diagnóstico: ${d.kind} — ${d.title}`, `  ${d.explanation}`, `  Qué hacer: ${d.action}`)
    if (d.evidence.length > 0) {
      out.push("  Evidencia:")
      for (const line of d.evidence) out.push(`    ${line}`)
    }
  } else {
    out.push("Diagnóstico: sin causa reconocida")
  }
  return out
}

export function buildSupportReport(input: {
  runtime: RuntimeInfo | null
  pack: PackEntry | null
  game: GameState
  settings: Settings
  logs: LogLine[]
}): string {
  const { runtime, pack, game, settings, logs } = input

  const header = [
    "Boffmedia App — informe de diagnóstico",
    `Generado: ${new Date().toISOString()}`,
    runtime
      ? `App: ${runtime.appVersion} (${runtime.platform}/${runtime.arch}, tauri ${runtime.tauri})`
      : "App: modo navegador (sin datos del shell)",
    packLine(pack),
    `Memoria: ${settings.memoryAuto ? "automática" : `${settings.memoryMib} MiB`} · Java: ${
      settings.javaPath ? settings.javaPath : "gestionado por el launcher"
    }`,
    ...diagnosisBlock(game),
  ]

  const tail = logs.slice(-TAIL_LINES)
  const body = [
    "",
    `Registro (${tail.length} de ${logs.length} líneas):`,
    ...tail.map((l) => `${formatClock(l.ts)} [${l.level}] (${l.source}) ${l.text}`),
  ]

  return [...header, ...body].join("\n")
}
