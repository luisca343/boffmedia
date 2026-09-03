"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Button } from "@boffmedia/ui"
import { SrtNumberStepper, SrtEntrantRow, SrtSeedTag, SrtWinnerList, SrtReelStage, SrtWheelStage, SrtSpotlightStage, type Entrant, type SrtDrawParticipant } from "@/components/boffmedia/ui/giveaways"

const DEMO_POOL: Entrant[] = [
  { id: "a", name: "AxelCraft", weight: 3 },
  { id: "b", name: "NovaPixel", weight: 1 },
  { id: "c", name: "RotomChef", weight: 2 },
  { id: "d", name: "WingullMain", weight: 1 },
  { id: "e", name: "PixelDrake", weight: 1 },
  { id: "f", name: "Lumaflux", weight: 2 },
]

// Self-contained reel preview: «Girar» picks a random winner and remounts
// the reel (fresh key) so useSrtReel replays with its tick/win sound.
function ReelDemo() {
  const participants: SrtDrawParticipant[] = DEMO_POOL.map((e) => ({ name: e.name, weight: e.weight }))
  const names = DEMO_POOL.map((e) => e.name)
  const [spin, setSpin] = React.useState<{ id: number; winner: string; mode: "reel" | "wheel" | "spotlight" } | null>(null)
  const [running, setRunning] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const start = (mode: "reel" | "wheel" | "spotlight") => {
    const winner = names[Math.floor(Math.random() * names.length)]
    setSpin((s) => ({ id: (s?.id ?? 0) + 1, winner, mode }))
    setRunning(true)
  }
  return (
    <div className="grid w-full max-w-[35rem] gap-4">
      {spin && (
        <>
          {spin.mode === "reel" && (
            <SrtReelStage
              key={`reel-${spin.id}`}
              participants={participants}
              winners={[spin.winner]}
              weighted={true}
              muted={muted}
              onMutedChange={setMuted}
              onComplete={() => setRunning(false)}
            />
          )}
          {spin.mode === "wheel" && (
            <SrtWheelStage
              key={`wheel-${spin.id}`}
              participants={participants}
              winners={[spin.winner]}
              weighted={true}
              muted={muted}
              onMutedChange={setMuted}
              onComplete={() => setRunning(false)}
            />
          )}
          {spin.mode === "spotlight" && (
            <SrtSpotlightStage
              key={`spotlight-${spin.id}`}
              participants={participants}
              winners={[spin.winner]}
              weighted={true}
              muted={muted}
              onMutedChange={setMuted}
              onComplete={() => setRunning(false)}
            />
          )}
        </>
      )}
      <div className="flex justify-center gap-2">
        <Button variant="pri" icon="bolt" onClick={() => start("reel")} disabled={running && !!spin}>
          {spin?.mode === "reel" ? "Girar de nuevo" : "Carrete"}
        </Button>
        <Button variant="default" onClick={() => start("wheel")} disabled={running && !!spin}>
          {spin?.mode === "wheel" ? "Girar de nuevo" : "Ruleta"}
        </Button>
        <Button variant="default" onClick={() => start("spotlight")} disabled={running && !!spin}>
          {spin?.mode === "spotlight" ? "Girar de nuevo" : "Foco"}
        </Button>
      </div>
    </div>
  )
}

export function SorteoRapidoChapter() {
  const [pool, setPool] = React.useState(DEMO_POOL)
  const [weighted, setWeighted] = React.useState(true)
  const [w, setW] = React.useState(3)
  const winners = pool.slice(0, 2)
  return (
    <>
      <Section
        id="srqspin"
        kicker="Sorteo rápido"
        title="Ruleta del sorteo"
        lead={<>La animación del sorteo (<code>SrtReelStage</code>): una tira horizontal que decelera hasta el ganador, con su sonido de tic/victoria. Restilizada a v3 «Señal» — grafito + naranja de marca, cortes diagonales, indicador REC en directo — conservando la física del carrete (<code>useSrtReel</code>). Pulsa <em>Girar</em> para reproducirla.</>}
      >
        <Sample title="Carrete en directo" code="<SrtReelStage participants winners muted onMutedChange onComplete>" col>
          <ReelDemo />
        </Sample>
      </Section>

      <Section
        id="srqrow"
        kicker="Sorteo rápido"
        title="Fila de participante"
        lead={<>El sorteo rápido (spinner ponderado) se arma con el kit <code>srt-*</code> movido a <code>@/components/boffmedia/ui/giveaways</code>. La fila de participante (<code>SrtEntrantRow</code>) admite renombrar (doble clic), peso y quitar; el paso de peso (<code>SrtNumberStepper</code>) es reutilizable suelto. <em>Nota:</em> el sistema de sorteos con tarjetas/premios/requisitos del handoff no está en el producto — el sorteo local es el spinner. [aplazado]</>}
      >
        <Sample title="Chasis y filas" code="<Panel> · <SrtEntrantRow>" col>
          <div className="w-full max-w-[32.5rem]">
            {/* Simplified demo: Panel is from @boffmedia/ui, SrtEntrantRow is from giveaways */}
            <div className="border border-line bg-panel">
              <div className="border-b border-line px-[1.25rem] py-[0.9375rem]">
                <h3 className="flex items-center gap-[0.625rem] font-display text-[1rem] font-bold not-italic uppercase tracking-[0.04em] text-txt">
                  Participantes
                </h3>
              </div>
              <ul role="list" className="divide-y divide-line">
                {pool.map((e, i) => (
                  <li key={e.id}>
                    <SrtEntrantRow
                      index={i + 1}
                      entrant={e}
                      weighted={weighted}
                      won={false}
                      removeLabel="Quitar"
                      onRename={(name) => setPool((p) => p.map((x) => (x.id === e.id ? { ...x, name } : x)))}
                      onWeight={(weight) => setPool((p) => p.map((x) => (x.id === e.id ? { ...x, weight } : x)))}
                      onRemove={() => setPool((p) => p.filter((x) => x.id !== e.id))}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Sample>
        <Sample title="Paso de peso" code="<SrtNumberStepper value onChange>">
          <SrtNumberStepper value={w} onChange={setW} />
          <SrtNumberStepper value={w} onChange={setW} size="sm" />
        </Sample>
      </Section>

      <Section
        id="srqreveal"
        kicker="Sorteo rápido"
        title="Ganadores y semilla"
        lead={<>El resultado del sorteo: la lista de ganadores con su probabilidad (<code>SrtWinnerList</code>) y la etiqueta de semilla verificable (<code>SrtSeedTag</code>) que permite reproducir el sorteo. La tira girando es la <code>Ruleta del sorteo</code> de arriba.</>}
      >
        <Sample title="Ganadores" code="<SrtWinnerList winners pool weighted>" col>
          <div className="w-full max-w-[32.5rem]">
            <SrtWinnerList winners={winners} pool={pool} weighted={weighted} />
          </div>
        </Sample>
        <Sample title="Semilla verificable" code="<SrtSeedTag seed copyLabel copiedLabel seedLabel>" col>
          <SrtSeedTag seed="8F3K2XQW7T" seedLabel="Semilla" copyLabel="Copiar" copiedLabel="Copiado" />
        </Sample>
      </Section>
    </>
  )
}
