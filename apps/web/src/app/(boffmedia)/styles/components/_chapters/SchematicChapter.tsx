"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sample, Section } from "../showcase-shared"
import { DropZone, Icon, Stepper, type DropZoneFile } from "@boffmedia/ui"
import { AssetThumb, AxisSlider, PreviewShell, type SchRing } from "@/components/boffmedia/ui/schematic"
import { ScanCard } from "@/tools/schematic-compat/_components/setup/ScanCard"
import { FilterChips } from "@/tools/schematic-compat/_components/diff/FilterChips"
import { MappingCard } from "@/tools/schematic-compat/_components/diff/MappingCard"
import { BulkRulesSheet } from "@/tools/schematic-compat/_components/diff/BulkRulesSheet"
import { CompatMeter } from "@/tools/schematic-compat/_components/export/CompatMeter"
import { ExportBarUI } from "@/tools/schematic-compat/_components/export/ExportBarUI"
import type { BulkNsGroup, SchDiffEntry, SchGame, SchStatus } from "@/tools/schematic-compat/_components/ui/sch-tokens"

// Demo entries — the showcase supplies its own strings and data; the components
// themselves are the ones the tool ships. [deferred]
const MISSING: SchDiffEntry = { block: { id: "create:cogwheel", namespace: "create", states: { axis: "x" } }, status: "missing", instanceCount: 420 }
const MODONLY: SchDiffEntry = { block: { id: "mekanism:steel_casing", namespace: "mekanism", states: {} }, status: "mod-only", instanceCount: 92 }
const RENAMED: SchDiffEntry = { block: { id: "minecraft:grass_path", namespace: "minecraft", states: {} }, status: "renamed", instanceCount: 312, autoCandidate: "minecraft:dirt_path" }
const STATE: SchDiffEntry = { block: { id: "minecraft:copper_bulb", namespace: "minecraft", states: { lit: "true", powered: "false" } }, status: "state-changed", instanceCount: 64, autoCandidate: "minecraft:waxed_copper_bulb", incompatibleStates: ["powered"] }
const OPTS = ["minecraft:iron_bars", "minecraft:cobblestone", "minecraft:air", "minecraft:dirt_path", "minecraft:waxed_copper_bulb", "minecraft:lantern"]
const BULK: BulkNsGroup[] = [
  { namespace: "create", entries: [MISSING, MISSING, MISSING], remap: 1 },
  { namespace: "botania", entries: [MISSING, MISSING], remap: 0 },
  { namespace: "mekanism", entries: [MODONLY], remap: 0 },
]
const DEMO_FILE: DropZoneFile = { name: "castle_gate.litematic", size: "1.2 MB", meta: "64×48×64" }

function SchToggle({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("h-8 border border-solid px-[11px] font-mono text-[11px] transition-[color,border-color,background] duration-[140ms]", on ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line bg-panel text-txt-muted hover:border-line-2 hover:text-txt")}>
      {children}
    </button>
  )
}

/** Stand-in for the WebGL canvas so the shell can be shown without a document. */
function DemoStage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
      <svg width="110" height="110" viewBox="0 0 120 120" fill="none" style={{ filter: "drop-shadow(0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent))" }}>
        <g stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M60 16 L100 38 L60 60 L20 38 Z" fill="color-mix(in srgb, var(--accent) 30%, transparent)" />
          <path d="M20 38 L60 60 L60 104 L20 82 Z" fill="color-mix(in srgb, var(--accent) 15%, transparent)" />
          <path d="M100 38 L60 60 L60 104 L100 82 Z" fill="color-mix(in srgb, var(--accent) 9%, transparent)" />
        </g>
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-dim">Vista 3D del esquema · WebGL</span>
    </div>
  )
}

export function SchematicChapter() {
  const [step, setStep] = React.useState(2)
  const [g1, setG1] = React.useState<SchGame>("minecraft")
  const [g2, setG2] = React.useState<SchGame>("hytale")
  const [file, setFile] = React.useState<DropZoneFile | null>(DEMO_FILE)
  const [filter, setFilter] = React.useState<SchStatus | null>(null)
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
            Piezas de <strong>Schematic Compat</strong> (Minecraft · Hytale). <code>Stepper</code> es una primitiva —marca el progreso de cualquier flujo por fases—; el medidor de preparación resume «N de M resueltos» con anillo, cifra en italic y desglose mono, y vive con la herramienta porque conoce la semántica del diff.
          </>
        }
      >
        <Sample title="Indicador de pasos" code="<Stepper steps current>" note="Completados con check, activo en acento, pendientes atenuados. Bajo 1100px se ocultan las etiquetas y quedan los números.">
          <div className="grid w-full justify-items-center gap-4">
            <Stepper steps={["Entornos", "Esquema", "Analizar", "Exportar"]} current={step} />
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
        lead={<>La captura de entorno cubre origen y destino con un conmutador de juego, botón de carpeta, barra de escaneo y línea de resultado con LED. <code>DropZone</code> es una primitiva: recibe sus textos por props y tiene estados vacío / arrastrando / cargado.</>}
      >
        <Sample title="Tarjeta de entorno" code="<ScanCard role game registry scanning>" col note="El rol tiñe el punto del encabezado; el borde se enciende en verde cuando el registro está listo. El resultado se lee en texto (versión · loader · mods · bloques), no solo por color.">
          <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
            <ScanCard role="source" roleLabel="Origen" game={g1} onGame={setG1} registry={{ name: "SkyFactory 5", version: "1.20.1", loader: "Fabric", mods: 142, blocks: 4310 }} onPick={() => {}} />
            <ScanCard role="target" roleLabel="Destino" game={g2} onGame={setG2} registry={null} onPick={() => {}} />
          </div>
        </Sample>
        <Sample title="Zona de carga" code="<DropZone file label hint loadedLabel onPick>" col>
          <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
            <DropZone file={null} label="Suelta tu esquema" hint=".schem · .litematic · .nbt · .mca · .prefab" loadedLabel="Cargado" onPick={() => setFile(DEMO_FILE)} />
            <DropZone file={file} label="Suelta tu esquema" hint=".schem · .litematic · .nbt · .mca · .prefab" loadedLabel="Cargado" onPick={() => setFile(null)} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schdiff"
        kicker="Schematic Compat"
        title="Diff y filtros"
        lead={<>Los chips de recuento filtran el diff por estado: cada uno con LED, cifra mono y etiqueta. <code>AssetThumb</code> genera un respaldo determinista (color por hash del id + inicial) cuando no hay textura — el mismo id da siempre el mismo color, y es el mismo hash que usa el visor 3D.</>}
      >
        <Sample title="Chips de estado" code="<FilterChips chips active onToggle>" note="Al activar uno, el resto se atenúa; los de recuento 0 se deshabilitan. Severidad codificada en el LED: verde → ámbar → rojo.">
          <FilterChips
            active={filter}
            onToggle={(k) => setFilter((c) => (c === k ? null : k))}
            chips={[
              { key: "safe", label: "Compatibles", count: 4 },
              { key: "renamed", label: "Renombrados", count: 2 },
              { key: "state-changed", label: "Estados", count: 2 },
              { key: "missing", label: "Ausentes", count: 4 },
            ]}
          />
        </Sample>
        <Sample title="Tile de bloque" code="<AssetThumb id size ring>" note="<code>ring</code> acepta el tono de estado (<code>safe</code> · <code>warn</code> · <code>bad</code>). El respaldo es estable: el ojo aprende a reconocer bloques por su color.">
          <div className="flex flex-wrap items-end gap-[18px]">
            {([["minecraft:stone_bricks", "safe"], ["minecraft:copper_bulb", "warn"], ["create:cogwheel", "bad"], ["botania:livingrock", null], ["mekanism:steel_casing", null]] as const).map(([id, ring]) => (
              <div key={id} className="flex flex-col items-center gap-1.5">
                <AssetThumb id={id} size={44} ring={ring as SchRing} />
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
            <code>MappingCard</code> es la fila origen→destino: thumb de origen, flecha al destino efectivo, la regla automática, las instancias y los chips de estado (rojo = incompatible). El combobox de reemplazo abre en <em>popover</em> fijo para escapar del overflow de la lista.
          </>
        }
      >
        <Sample title="Tarjeta de mapeo" code="<MappingCard entry options resolution onResolve>" col note="Seleccionable (sincroniza con la vista 3D); el combobox detiene la propagación para no alternar la selección de la fila.">
          <div className="grid w-full gap-2">
            <MappingCard entry={MISSING} options={OPTS} resolution={res[MISSING.block.id]} onResolve={resolve} selected={sel === "a"} onSelect={() => setSel((s) => (s === "a" ? null : "a"))} />
            <MappingCard entry={RENAMED} options={OPTS} resolution={res[RENAMED.block.id]} onResolve={resolve} selected={sel === "b"} onSelect={() => setSel((s) => (s === "b" ? null : "b"))} />
            <MappingCard entry={STATE} options={OPTS} resolution={res[STATE.block.id]} onResolve={resolve} selected={sel === "c"} onSelect={() => setSel((s) => (s === "c" ? null : "c"))} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schvista"
        kicker="Schematic Compat"
        title="Vista 3D e inspección"
        lead={<><code>PreviewShell</code> es el marco compartido de cualquier vista 3D de esquemas: cabecera, fondo de rejilla, pantalla completa, conmutador órbita/vuelo, deslizador de capa y el pozo del inspector. El lienzo, la leyenda y el inspector entran como slots; los textos, como props.</>}
      >
        <Sample title="Marco de vista previa" code="<PreviewShell labels stage inspector>" col note="Aquí el escenario es un placeholder isométrico; en la herramienta es el lienzo WebGL real.">
          <div className="h-[420px] w-full border border-solid border-line">
            <PreviewShell
              labels={{ title: "Vista previa", fullscreen: "Pantalla completa", exitFullscreen: "Salir", navOrbit: "Órbita", navFly: "Vuelo", navOrbitHint: "Arrastra para orbitar", navFlyHint: "WASD para volar" }}
              navMode="orbit"
              onNavModeChange={() => {}}
              layerY={y}
              maxLayerY={47}
              onLayerYChange={setY}
              hasDocument
              stage={<DemoStage />}
              inspector={<span className="font-mono text-[11px] text-txt-dim">Clic en un bloque para inspeccionar</span>}
            />
          </div>
        </Sample>
        <Sample title="Deslizador de capa" code="<AxisSlider axis value max onChange>" col note="Recorta el esquema por eje; se usa suelto o embebido en el marco de arriba.">
          <div className="w-full max-w-[460px] border border-solid border-line bg-panel">
            <AxisSlider axis="Y" value={y} max={47} onChange={setY} />
          </div>
        </Sample>
      </Section>

      <Section
        id="schexport"
        kicker="Schematic Compat"
        title="Lote y exportación"
        lead={<>El panel de reglas en lote resuelve los ausentes de un mod entero de una vez (Omitir / Reasignar / → Aire, con previsualización). La barra de exportación cambia los formatos según el juego de destino y lleva el medidor de preparación al pie.</>}
      >
        <Sample title="Reglas en lote" code="<BulkRulesSheet open groups onApply>">
          <SchToggle on onClick={() => setSheet(true)}>
            <Icon name="layers" size={14} className="mr-1.5 -mb-0.5 inline-block" />
            Abrir reglas en lote
          </SchToggle>
        </Sample>
        <Sample title="Barra de exportación" code="<ExportBarUI targetGame canExport ruleCount meter>" col note="Formatos por destino: <code>.schem / .litematic / .nbt</code> para Minecraft, <code>.prefab.json</code> para Hytale. El botón de exportar esquema se habilita tras el análisis.">
          <div className="w-full border border-solid border-line bg-panel">
            <ExportBarUI targetGame="minecraft" canExport ruleCount={3} exporting={false} onExport={() => {}} meter={<CompatMeter resolved={11} total={14} blocked={3} />} />
          </div>
        </Sample>
      </Section>

      <BulkRulesSheet open={sheet} groups={BULK} onClose={() => setSheet(false)} onApply={() => setSheet(false)} />
    </>
  )
}
