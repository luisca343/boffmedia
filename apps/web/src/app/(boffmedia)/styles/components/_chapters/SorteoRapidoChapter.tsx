"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { SrtPanel, SrtPanelHead, SrtRow, SrtSeedTag, SrtWeight, SrtWinnerList } from "@/app/(boffmedia)/(herramientas)/otros/sorteos/_components/ui/srt-kit"
import type { Entrant } from "@/app/(boffmedia)/(herramientas)/otros/sorteos/_lib/useSorteos"

const DEMO_POOL: Entrant[] = [
  { id: "a", name: "AxelCraft", weight: 3 },
  { id: "b", name: "NovaPixel", weight: 1 },
  { id: "c", name: "RotomChef", weight: 2 },
  { id: "d", name: "WingullMain", weight: 1 },
]

export function SorteoRapidoChapter() {
  const [pool, setPool] = React.useState(DEMO_POOL)
  const [weighted, setWeighted] = React.useState(true)
  const [w, setW] = React.useState(3)
  const winners = pool.slice(0, 2)
  return (
    <>
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
        lead={<>El resultado del sorteo: la lista de ganadores con su probabilidad (<code>SrtWinnerList</code>) y la etiqueta de semilla verificable (<code>SrtSeedTag</code>) que permite reproducir el sorteo. La tira ponderada girando (el spinner) vive en la herramienta en vivo.</>}
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
