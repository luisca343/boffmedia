import { Kicker } from "@boffmedia/ui"

import { CrashDiagnosisCard } from "../components/CrashDiagnosis"
import { LogPanel } from "../components/pack/LogPanel"
import { useLauncher } from "../state/launcher"

export function Logs() {
  const { logs, clearLogs, game } = useLauncher()

  return (
    <div className="flex h-full min-h-0 flex-col px-8 py-7">
      <header className="mb-5">
        <Kicker>Diagnóstico</Kicker>
        <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
          Registro
        </h1>
      </header>

      {/* §9 — above the log, not inside it: the whole point is that the player
          never has to read the 4000 lines below to know what happened. */}
      {game.kind === "crashed" && (
        <div className="mb-4">
          <CrashDiagnosisCard diagnosis={game.diagnosis} />
        </div>
      )}

      <LogPanel lines={logs} onClear={clearLogs} className="flex min-h-0 flex-1 flex-col" />
    </div>
  )
}
