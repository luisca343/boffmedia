"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sample, Section } from "../showcase-shared"
import { Icon } from "@/components/boffmedia/primitives/icon"
import {
  BlockThumb,
  BulkRules,
  CompatMeter,
  EnvCard,
  ExportBar,
  IsoStage,
  LayerSlider,
  MapCard,
  MapRow,
  SchSteps,
  SchemaDrop,
  StatusChips,
  type SchBulkGroup,
  type SchEntry,
} from "@/components/boffmedia/ui/schematic"

// Demo entries (inline, mirrors v3-showcase-schematic.jsx). [deferred]
const MISSING: SchEntry = { block: { id: "create:cogwheel", namespace: "create", states: { axis: "x" } }, status: "missing", instanceCount: 420 }
const MODONLY: SchEntry = { block: { id: "mekanism:steel_casing", namespace: "mekanism", states: {} }, status: "mod-only", instanceCount: 92 }
const RENAMED: SchEntry = { block: { id: "minecraft:grass_path", namespace: "minecraft", states: {} }, status: "renamed", instanceCount: 312, autoCandidate: "minecraft:dirt_path" }
const STATE: SchEntry = { block: { id: "minecraft:copper_bulb", namespace: "minecraft", states: { lit: "true", powered: "false" } }, status: "state-changed", instanceCount: 64, autoCandidate: "minecraft:waxed_copper_bulb", incompatibleStates: ["powered"] }
const OPTS = ["minecraft:iron_bars", "minecraft:cobblestone", "minecraft:air", "minecraft:dirt_path", "minecraft:waxed_copper_bulb", "minecraft:lantern"]
const BULK: SchBulkGroup[] = [
  { namespace: "create", entries: [MISSING, MISSING, MISSING], remap: 1 },
  { namespace: "botania", entries: [MISSING, MISSING], remap: 0 },
  { namespace: "mekanism", entries: [MODONLY], remap: 0 },
]

function SchToggle({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("h-8 border border-solid px-[11px] font-mono text-[11px] transition-[color,border-color,background] duration-[140ms]", on ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line bg-panel text-txt-muted hover:border-line-2 hover:text-txt")}>
      {children}
    </button>
  )
}

export function SchematicChapter() {
  const [step, setStep] = React.useState(2)
  const [g1, setG1] = React.useState("minecraft")
  const [g2, setG2] = React.useState("hytale")
  const [file, setFile] = React.useState<{ name: string; size: string; dims: string } | null>({ name: "castle_gate.litematic", size: "1.2 MB", dims: "64×48×64" })
  const [filter, setFilter] = React.useState<string | null>(null)
  const [res, setRes] = React.useState<Record<string, string>>({})
  const [sel, setSel] = React.useState<string | null>(null)
  const [y, setY] = React.useState(18)
  const [sheet, setSheet] = React.useState(false)
  const resolve = (id: string, t: string) =>
    setRes((r) => {
      const n = { ...r }
      if (t) n[id] = t
      else delete n[id]
      return n
    })

  return (
    <>
      <Section
        id="schflujo"
        kicker="Schematic Compat"
        title="Pasos y medidor"
        lead={
          <>
            Piezas extraídas de <strong>Schematic Compat</strong> (Minecraft · Hytale). El indicador de pasos marca el progreso del flujo; el medidor de preparación —<strong>nueva pieza reutilizable</strong>— resume «N de M resueltos» con anillo, cifra en italic y desglose mono. Sirve para cualquier proceso por fases.
          </>
        }
      >
        <Sample title="Indicador de pasos" code="<SchSteps steps current>" note="Completados con check, activo en acento, pendientes atenuados. Bajo 1180px se ocultan las etiquetas y quedan los números.">
          <div className="grid w-full justify-items-center gap-4">
            <SchSteps steps={["Entornos", "Esquema", "Analizar", "Exportar"]} current={step} />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <SchToggle key={n} on={step === n} onClick={() => setStep(n)}>
                  Paso {n + 1}
                </SchToggle>
              ))}
            </div>
          </div>
        </Sample>
        <Sample title="Medidor de preparación" code="<CompatMeter resolved total blocked>" col note="El tono del anillo cambia: acento mientras faltan reglas, <b>ámbar</b> si quedan bloqueos, <b>verde</b> al 100%.">
          <div className="flex flex-wrap gap-[22px]">
            <CompatMeter resolved={9} total={14} blocked={5} />
            <CompatMeter resolved={14} total={14} blocked={0} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schentorno"
        kicker="Schematic Compat"
        title="Entornos y carga"
        lead={<>La captura de entorno cubre origen y destino con un conmutador de juego, botón de carpeta, barra de escaneo y línea de resultado con LED. La zona de carga del esquema tiene estados vacío / arrastrando / cargado.</>}
      >
        <Sample title="Tarjeta de entorno" code="<EnvCard role game registry scanning>" col note="El rol tiñe el punto del encabezado; el borde se enciende en verde cuando el registro está listo. El resultado se lee en texto (versión · loader · mods · bloques), no solo por color.">
          <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
            <EnvCard role="source" roleLabel="Origen" game={g1} onGame={setG1} registry={{ name: "SkyFactory 5", version: "1.20.1", loader: "Fabric", mods: 142, blocks: 4310 }} onPick={() => {}} />
            <EnvCard role="target" roleLabel="Destino" game={g2} onGame={setG2} registry={null} onPick={() => {}} />
          </div>
        </Sample>
        <Sample title="Carga de esquema" code="<SchemaDrop file onPick>" col>
          <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SchemaDrop file={null} onPick={() => setFile({ name: "castle_gate.litematic", size: "1.2 MB", dims: "64×48×64" })} />
            <SchemaDrop file={file} onPick={() => setFile(null)} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schdiff"
        kicker="Schematic Compat"
        title="Diff y filtros"
        lead={<>Los chips de recuento filtran el diff por estado: cada uno con LED, cifra mono y etiqueta. El tile de bloque genera un respaldo determinista (color oklch por hash del id + inicial) cuando no hay textura — el mismo id da siempre el mismo color.</>}
      >
        <Sample title="Chips de estado" code="<StatusChips chips active onToggle>" note="Al activar uno, el resto se atenúa; los de recuento 0 se deshabilitan. Severidad codificada en el LED: verde → ámbar → rojo.">
          <StatusChips active={filter} onToggle={(k) => setFilter((c) => (c === k ? null : k))} chips={[{ key: "safe", label: "Compatibles", count: 4 }, { key: "renamed", label: "Renombrados", count: 2 }, { key: "state-changed", label: "Estados", count: 2 }, { key: "missing", label: "Ausentes", count: 4 }, { key: "mod-only", label: "Solo mod", count: 2 }]} />
        </Sample>
        <Sample title="Tile de bloque" code="<BlockThumb id size ring>" note="<code>ring</code> acepta el tono de estado (<code>ok</code> · <code>warn</code> · <code>bad</code>). El respaldo es estable: el ojo aprende a reconocer bloques por su color.">
          <div className="flex flex-wrap items-end gap-[18px]">
            {([["minecraft:stone_bricks", "ok"], ["minecraft:copper_bulb", "warn"], ["create:cogwheel", "bad"], ["botania:livingrock", null], ["mekanism:steel_casing", null]] as const).map(([id, ring]) => (
              <div key={id} className="flex flex-col items-center gap-1.5">
                <BlockThumb id={id} size={44} ring={ring} />
                <span className="font-mono text-[10px] text-txt-dim">{id.split(":")[1]}</span>
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="schmapeo"
        kicker="Schematic Compat"
        title="Filas de mapeo"
        lead={
          <>
            Dos densidades para una fila origen→destino. <code>MapRow</code> es la línea compacta para listas largas de ausentes (thumb, punto, id, recuento, combobox de reemplazo). <code>MapCard</code> es la tarjeta verbosa para renombrados / estados: añade el destino, la regla automática, las instancias y los chips de estado (rojo = incompatible).
          </>
        }
      >
        <Sample title="Fila compacta y tarjeta verbosa" code="<MapRow> · <MapCard>" col note="Ambas son seleccionables (sincronizan con la vista 3D); el combobox detiene la propagación para no alternar la selección de la fila.">
          <div className="grid w-full gap-2">
            <MapRow entry={MISSING} options={OPTS} resolution={res[MISSING.block.id]} onResolve={resolve} selected={sel === "a"} onSelect={() => setSel((s) => (s === "a" ? null : "a"))} />
            <MapCard entry={RENAMED} options={OPTS} resolution={res[RENAMED.block.id]} onResolve={resolve} selected={sel === "b"} onSelect={() => setSel((s) => (s === "b" ? null : "b"))} />
            <MapCard entry={STATE} options={OPTS} resolution={res[STATE.block.id]} onResolve={resolve} selected={sel === "c"} onSelect={() => setSel((s) => (s === "c" ? null : "c"))} />
          </div>
        </Sample>
      </Section>

      <Section id="schvista" kicker="Schematic Compat" title="Vista 3D e inspección" lead={<>El escenario de vista previa (placeholder isométrico + rejilla de retransmisión, sustituible por el visor WebGL real) y el deslizador de capa para recortar el esquema por eje.</>}>
        <Sample title="Escenario y deslizador" code="<IsoStage> · <LayerSlider axis value max>" col>
          <div className="grid w-full max-w-[460px] gap-3.5">
            <div className="h-[220px] border border-solid border-line bg-panel">
              <IsoStage selected={false} />
            </div>
            <LayerSlider axis="Y" value={y} max={47} onChange={setY} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schexport"
        kicker="Schematic Compat"
        title="Lote y exportación"
        lead={<>El panel de reglas en lote resuelve los ausentes de un mod entero de una vez (Saltar / Remapear / → Aire, con previsualización). La barra de exportación cambia los formatos según el juego de destino y lleva el medidor de preparación al pie.</>}
      >
        <Sample title="Reglas en lote" code="<BulkRules open groups onApply>">
          <SchToggle on onClick={() => setSheet(true)}>
            <Icon name="layers" size={14} className="mr-1.5 -mb-0.5 inline-block" />
            Abrir reglas en lote
          </SchToggle>
        </Sample>
        <Sample title="Barra de exportación" code="<ExportBar targetGame canExport ruleCount meter>" col note="Formatos por destino: <code>.schem / .litematic / .nbt</code> para Minecraft, <code>.prefab.json</code> para Hytale. El botón de exportar esquema se habilita tras el análisis.">
          <div className="w-full border border-solid border-line bg-panel">
            <ExportBar targetGame="minecraft" canExport ruleCount={3} exporting={false} onExport={() => {}} meter={<CompatMeter resolved={11} total={14} blocked={3} />} />
          </div>
        </Sample>
      </Section>

      <BulkRules open={sheet} groups={BULK} onClose={() => setSheet(false)} onApply={() => setSheet(false)} />
    </>
  )
}
