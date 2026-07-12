"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Button } from "@/components/boffmedia/primitives"
import { SrtPanel, SrtPanelHead, SrtRow, SrtSeedTag, SrtWeight, SrtWinnerList } from "@/app/(boffmedia)/(herramientas)/otros/sorteos/_components/ui/srt-kit"
import type { Entrant } from "@/app/(boffmedia)/(herramientas)/otros/sorteos/_lib/useSorteos"
import SpinnerAnimation from "@/app/(boffmedia)/(herramientas)/otros/sorteos/_components/spinner/SpinnerAnimation"

const DEMO_POOL: Entrant[] = [
  { id: "a", name: "AxelCraft", weight: 3 },
  { id: "b", name: "NovaPixel", weight: 1 },
  { id: "c", name: "RotomChef", weight: 2 },
  { id: "d", name: "WingullMain", weight: 1 },
  { id: "e", name: "PixelDrake", weight: 1 },
  { id: "f", name: "Lumaflux", weight: 2 },
]

// Self-contained spinner preview: «Girar» picks a random winner and remounts
// the reel (fresh key) so useBaseSpinnerAnimation replays with its tick/win sound.
function SpinnerDemo() {
  const names = DEMO_POOL.map((e) => e.name)
  const [spin, setSpin] = React.useState<{ id: number; winner: string } | null>(null)
  const [running, setRunning] = React.useState(false)
  const start = () => {
    const winner = names[Math.floor(Math.random() * names.length)]
    setSpin((s) => ({ id: (s?.id ?? 0) + 1, winner }))
    setRunning(true)
  }
  return (
    <div className="grid w-full max-w-[560px] gap-4">
      <SpinnerAnimation
        key={spin?.id ?? "idle"}
        participants={names}
        winner={spin?.winner ?? null}
        onComplete={() => setRunning(false)}
      />
      <div className="flex justify-center">
        <Button variant="pri" icon="bolt" onClick={start} disabled={running}>
          {spin ? "Girar de nuevo" : "Girar"}
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
        lead={<>La animación del sorteo (<code>SpinnerAnimation</code>): una tira horizontal que decelera hasta el ganador, con su sonido de tic/victoria. Restilizada a v3 «Señal» — grafito + naranja de marca, cortes diagonales, indicador REC en directo — conservando la física del carrete (<code>useBaseSpinnerAnimation</code>). Pulsa <em>Girar</em> para reproducirla.</>}
      >
        <Sample title="Carrete en directo" code="<SpinnerAnimation participants winner onComplete>" col>
          <SpinnerDemo />
        </Sample>
      </Section>

      <Section
        id="srqrow"
        kicker="Sorteo rápido"
        title="Fila de participante"
        lead={<>El sorteo rápido (spinner ponderado) se arma con el kit <code>srt-*</code>. La fila de participante (<code>SrtRow</code>) admite renombrar (doble clic), peso y quitar; el paso de peso (<code>SrtWeight</code>) es reutilizable suelto. <em>Nota:</em> el sistema de sorteos con tarjetas/premios/requisitos del handoff no está en el producto — el sorteo local es el spinner. [aplazado]</>}
      >
        <Sample title="Chasis y filas" code="<SrtPanel> · <SrtPanelHead> · <SrtRow>" col>
          <div className="w-full max-w-[520px]">
            <SrtPanel>
              <SrtPanelHead
                icon="users"
                title="Participantes"
                right={
                  <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-txt-muted">
                    <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
                    Ponderado
                  </label>
                }
              />
              <div>
                {pool.map((e, i) => (
                  <SrtRow
                    key={e.id}
                    index={i + 1}
                    entrant={e}
                    weighted={weighted}
                    won={false}
                    removeLabel="Quitar"
                    onRename={(name) => setPool((p) => p.map((x) => (x.id === e.id ? { ...x, name } : x)))}
                    onWeight={(weight) => setPool((p) => p.map((x) => (x.id === e.id ? { ...x, weight } : x)))}
                    onRemove={() => setPool((p) => p.filter((x) => x.id !== e.id))}
                  />
                ))}
                {pool.length === 0 && (
                  <p className="px-[14px] py-4 text-center font-mono text-[12px] text-txt-dim">Sin participantes.</p>
                )}
              </div>
            </SrtPanel>
          </div>
        </Sample>
        <Sample title="Paso de peso" code="<SrtWeight value onChange>">
          <SrtWeight value={w} onChange={setW} />
          <SrtWeight value={w} onChange={setW} sm />
        </Sample>
      </Section>

      <Section
        id="srqreveal"
        kicker="Sorteo rápido"
        title="Ganadores y semilla"
        lead={<>El resultado del sorteo: la lista de ganadores con su probabilidad (<code>SrtWinnerList</code>) y la etiqueta de semilla verificable (<code>SrtSeedTag</code>) que permite reproducir el sorteo. La tira girando es la <code>Ruleta del sorteo</code> de arriba.</>}
      >
        <Sample title="Ganadores" code="<SrtWinnerList winners pool weighted>" col>
          <div className="w-full max-w-[520px]">
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
