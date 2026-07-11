"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, Button, Icon } from "@/components/boffmedia/primitives"
import { BlockThumb, SchGlyph } from "./SchAtoms"
import { SCH_STATUS, schToneVars, type SchBulkGroup, type SchEntry, type SchRegistry } from "./schematic-util"

// Schematic Compat panels: environment capture, schema drop, replace combobox,
// mapping row/card, export bar and the bulk-rules sheet. Prefix sch-.

const SCH_GAMES = [
  { id: "minecraft", label: "Minecraft", icon: "cube" as const },
  { id: "hytale", label: "Hytale", icon: "gamepad" as const },
]

export function EnvCard({ role, roleLabel, game, onGame, registry, scanning, progress = 0, onPick }: { role: "source" | "target"; roleLabel: string; game: string; onGame: (g: string) => void; registry?: SchRegistry | null; scanning?: boolean; progress?: number; onPick?: () => void }) {
  return (
    <div className={cn("flex flex-col gap-2.5 border border-solid border-line border-l-4 bg-panel p-3 transition-[border-color] duration-[140ms]", role === "source" ? "border-l-accent" : "border-l-[color:var(--info)]", registry && "border-[color-mix(in_srgb,var(--ok)_40%,var(--line))]")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-txt-muted">
          <span className={cn("h-1.5 w-1.5", role === "source" ? "bg-accent" : "bg-[color:var(--info)]")} />
          {roleLabel}
        </span>
        <div className="flex gap-0.5 border border-solid border-line bg-base p-0.5" role="group" aria-label="Juego">
          {SCH_GAMES.map((g) => (
            <button key={g.id} type="button" aria-pressed={game === g.id} disabled={scanning} onClick={() => onGame(g.id)} className={cn("flex items-center gap-1 border-0 bg-transparent px-[7px] py-1 font-mono text-[10.5px] transition-[color] duration-[140ms] disabled:cursor-default disabled:opacity-50", game === g.id ? "bg-panel-2 text-txt [box-shadow:inset_0_0_0_1px_var(--line-2)]" : "text-txt-dim hover:text-txt-muted")}>
              {g.icon === "cube" ? <SchGlyph name="cube" size={12} /> : <Icon name="gamepad" size={12} />}
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={onPick} disabled={scanning} className="flex w-full items-center justify-center gap-2 border border-dashed border-line-2 bg-base p-[9px] font-body text-[13px] text-txt-muted transition-[border-color,color] duration-[140ms] hover:border-accent-line hover:text-txt disabled:cursor-default disabled:opacity-60">
        <SchGlyph name="folder" size={15} />
        {scanning ? "Escaneando…" : game === "hytale" ? "Carpeta / Assets.zip" : "Elegir instancia"}
      </button>

      {scanning ? (
        <div className="h-1 overflow-hidden bg-line">
          <i className="block h-full bg-accent transition-[width] duration-[120ms]" style={{ width: progress + "%" }} />
        </div>
      ) : null}

      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 flex-none rounded-full", registry ? "bg-ok [box-shadow:0_0_0_3px_var(--ok-soft)]" : "bg-txt-dim")} />
        {registry ? (
          <span className="text-[12px]/[1.5] text-txt-muted [&_b]:font-semibold [&_b]:text-txt [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-accent-bright">
            {registry.name ? (
              <>
                <b>{registry.name}</b> ·{" "}
              </>
            ) : null}
            <code>{registry.version}</code>
            {registry.loader ? " · " + registry.loader : ""}
            <br />
            {registry.mods} mods · {registry.blocks.toLocaleString()} bloques
          </span>
        ) : (
          <span className="mt-0.5 text-[12px] text-txt-dim">{scanning ? progress + "% · leyendo registro…" : "Sin entorno"}</span>
        )}
      </div>
    </div>
  )
}

export function SchemaDrop({ file, onPick }: { file?: { name: string; size: string; dims: string } | null; onPick?: () => void }) {
  const [over, setOver] = React.useState(false)
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onPick && onPick()
    }
  }
  if (file) {
    return (
      <div role="button" tabIndex={0} onClick={onPick} onKeyDown={key} className="flex cursor-pointer items-center gap-2.5 border border-solid border-[color-mix(in_srgb,var(--ok)_40%,var(--line))] bg-panel px-3 py-[11px] text-left">
        <SchGlyph name="cube" size={20} className="text-ok" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[12.5px] text-txt">{file.name}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-txt-dim">
            {file.size} · {file.dims}
          </div>
        </div>
        <Badge tone="ok">Cargado</Badge>
      </div>
    )
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={key}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onPick && onPick()
      }}
      className={cn("group flex cursor-pointer flex-col items-center gap-1.5 border border-dashed bg-panel px-[14px] py-5 text-center transition-[border-color,background] duration-[140ms]", over ? "border-accent bg-accent-soft" : "border-line-2 hover:border-accent hover:bg-accent-soft")}
    >
      <SchGlyph name="upload" size={22} className={cn(over ? "text-accent-bright" : "text-txt-dim group-hover:text-accent-bright")} />
      <div className="text-[14px] font-semibold text-txt">Suelta tu esquema</div>
      <div className="font-mono text-[10.5px] tracking-[0.04em] text-txt-dim">.schem · .litematic · .nbt · .mca · .prefab</div>
    </div>
  )
}

export function ReplaceCombo({ value, placeholder, options, onChange }: { value?: string; placeholder?: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const ref = React.useRef<HTMLDivElement>(null)
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options
  }, [q, options])
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])
  return (
    <div ref={ref} className="relative w-[168px] flex-none" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setQ("")
          setOpen((v) => !v)
        }}
        className={cn("flex h-[30px] w-full items-center gap-1.5 border border-solid bg-base px-2 text-txt transition-[border-color] duration-[140ms]", open ? "border-accent-line" : "border-line hover:border-accent-line")}
      >
        {value ? <BlockThumb id={value} size={18} /> : null}
        <span className={cn("min-w-0 flex-1 truncate text-left", value ? "font-mono text-[11px]" : "text-[12px] text-txt-dim")}>{value || placeholder}</span>
        <Icon name="chevronDown" size={13} className={cn("flex-none text-txt-dim transition-transform duration-[140ms]", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-[34px] z-[900] flex max-h-[280px] w-full flex-col border border-solid border-line-2 bg-panel [box-shadow:0_18px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-1.5 border-b border-solid border-line px-2.5 py-2 text-txt-dim">
            <Icon name="search" size={13} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar bloque…" className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[12px] text-txt outline-none placeholder:text-txt-dim" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-txt-dim">Sin resultados</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    onChange(o)
                    setOpen(false)
                  }}
                  className={cn("flex w-full items-center gap-2 border-0 bg-transparent px-2 py-1.5 transition-[background] duration-[140ms] hover:bg-panel-2 hover:text-txt", o === value ? "text-accent-bright" : "text-txt-muted")}
                >
                  <BlockThumb id={o} size={18} />
                  <span className="min-w-0 flex-1 truncate text-left font-mono text-[11.5px]">{o}</span>
                  {o === value ? <Icon name="check" size={13} /> : null}
                </button>
              ))
            )}
          </div>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              className="border-0 border-t border-solid border-line bg-transparent p-2 font-mono text-[10.5px] text-txt-dim hover:text-bad"
            >
              Limpiar selección
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function keyBtn(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      fn()
    }
  }
}

export function MapRow({ entry, options, resolution, onResolve, selected, onSelect }: { entry: SchEntry; options: string[]; resolution?: string; onResolve: (id: string, v: string) => void; selected?: boolean; onSelect?: () => void }) {
  const meta = SCH_STATUS[entry.status]
  const bad = meta.tone === "bad"
  return (
    <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={keyBtn(onSelect || (() => {}))} style={schToneVars(meta.tone)} className={cn("flex cursor-pointer items-center gap-[9px] border border-solid border-line border-l-[3px] border-l-[color:var(--st)] bg-panel px-[9px] py-1.5 transition-[background,border-color] duration-[140ms]", selected ? "border-accent bg-accent-soft [box-shadow:inset_0_0_0_1px_var(--accent-line)]" : bad ? "bg-[color-mix(in_srgb,var(--bad)_5%,var(--panel))] hover:bg-panel-2" : "hover:bg-panel-2")}>
      <BlockThumb id={entry.block.id} size={24} ring={meta.tone} />
      <span className="h-1.5 w-1.5 flex-none rounded-full bg-[color:var(--st)]" />
      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-txt">{entry.block.id}</span>
      <span className={cn("flex-none px-1.5 py-0.5 font-mono text-[10.5px] font-semibold", bad ? "bg-bad-soft text-bad" : "bg-panel-2 text-txt-muted")}>×{entry.instanceCount.toLocaleString()}</span>
      <ReplaceCombo value={resolution} placeholder="Reemplazar…" options={options} onChange={(v) => onResolve(entry.block.id, v)} />
      {resolution ? <BlockThumb id={resolution} size={24} /> : null}
    </div>
  )
}

export function MapCard({ entry, options, resolution, onResolve, selected, onSelect }: { entry: SchEntry; options: string[]; resolution?: string; onResolve: (id: string, v: string) => void; selected?: boolean; onSelect?: () => void }) {
  const meta = SCH_STATUS[entry.status]
  const auto = entry.autoCandidate
  const eff = resolution || auto
  const replaceable = entry.status === "renamed" || entry.status === "state-changed"
  const stateKeys = Object.keys(entry.block.states || {})
  return (
    <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={keyBtn(onSelect || (() => {}))} style={schToneVars(meta.tone)} className={cn("cursor-pointer border border-solid border-line border-l-[3px] border-l-[color:var(--st)] bg-panel p-2.5 transition-[background,border-color] duration-[140ms]", selected ? "border-accent bg-accent-soft [box-shadow:inset_0_0_0_1px_var(--accent-line)]" : "hover:bg-panel-2")}>
      <div className="flex items-start gap-2.5">
        <BlockThumb id={entry.block.id} size={34} ring={meta.tone} />
        {eff ? (
          <span className="flex items-center gap-1.5 self-center text-txt-dim">
            <Icon name="arrow" size={14} />
            <BlockThumb id={eff} size={28} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[7px]">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-[color:var(--st)]" />
            <span className="min-w-0 truncate font-mono text-[12px] text-txt">{entry.block.id}</span>
          </div>
          {eff ? (
            <div className={cn("mt-0.5 truncate pl-[13px] font-mono text-[11px]", resolution ? "text-accent-bright" : "text-[color:color-mix(in_srgb,var(--ok)_85%,var(--text))]")}>
              → {eff}
              {resolution ? " · manual" : ""}
            </div>
          ) : null}
          <div className="mt-[3px] pl-[13px] text-[11px] text-txt-dim">{entry.instanceCount.toLocaleString()} instancias</div>
          {stateKeys.length > 0 ? (
            <div className="mt-[7px] flex flex-wrap gap-1.5 pl-[13px]">
              {stateKeys.map((k) => {
                const badState = entry.incompatibleStates && entry.incompatibleStates.includes(k)
                return (
                  <span key={k} className={cn("px-1.5 py-0.5 font-mono text-[10px]", badState ? "bg-bad-soft text-bad" : "bg-panel-2 text-txt-muted")}>
                    {k}={String(entry.block.states[k])}
                  </span>
                )
              })}
            </div>
          ) : null}
          {replaceable ? (
            <div className="mt-[9px] flex items-center gap-2 pl-[13px]" onClick={(e) => e.stopPropagation()}>
              <span className="flex-none font-mono text-[9.5px] uppercase tracking-[0.08em] text-txt-dim">Reemplazar</span>
              <ReplaceCombo value={resolution} placeholder={auto || "Elegir…"} options={options} onChange={(v) => onResolve(entry.block.id, v)} />
              {resolution ? (
                <button type="button" onClick={() => onResolve(entry.block.id, "")} className="flex-none border-0 bg-transparent font-mono text-[10px] text-txt-dim underline underline-offset-2 hover:text-txt-muted">
                  auto
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const SCH_FMT: Record<string, [string, string][]> = {
  minecraft: [[".schem (v2)", "schem"], [".schem (v3)", "schem3"], [".litematic", "litematic"], [".nbt", "nbt"]],
  hytale: [[".prefab.json", "prefab"]],
}

export function ExportBar({ targetGame, canExport, ruleCount, exporting, onExport, meter }: { targetGame: string; canExport?: boolean; ruleCount: number; exporting?: boolean; onExport?: (fmt: string) => void; meter?: React.ReactNode }) {
  const formats = SCH_FMT[targetGame] || SCH_FMT.minecraft
  const [fmt, setFmt] = React.useState(formats[0][1])
  React.useEffect(() => {
    if (!formats.some((f) => f[1] === fmt)) setFmt(formats[0][1])
  }, [targetGame]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <footer className="flex items-center gap-[14px] border-t-2 border-solid border-line bg-base-deep px-4 py-2.5">
      {meter}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon="upload">
          Importar reglas
        </Button>
        <Button variant="ghost" size="sm" icon="download" disabled={ruleCount === 0}>
          Exportar reglas{ruleCount > 0 ? ` (${ruleCount})` : ""}
        </Button>
      </div>
      <div className="flex-1" />
      {exporting ? (
        <span className="flex items-center gap-2 font-mono text-[11px] text-accent-bright">
          <span className="h-[13px] w-[13px] rounded-full border-2 border-line-2 border-t-accent animate-[bm-spin_0.7s_linear_infinite] motion-reduce:animate-none" />
          Exportando…
        </span>
      ) : null}
      <select value={fmt} onChange={(e) => setFmt(e.target.value)} disabled={exporting} aria-label="Formato de exportación" className="h-[34px] w-auto min-w-[128px] border border-solid border-line bg-panel px-2 font-mono text-[12px] text-txt">
        {formats.map(([lbl, v]) => (
          <option key={v} value={v}>
            {lbl}
          </option>
        ))}
      </select>
      <Button variant="pri" icon="download" disabled={!canExport || exporting} onClick={() => onExport && onExport(fmt)}>
        Exportar esquema
      </Button>
    </footer>
  )
}

const BULK_ACTS: [string, string][] = [["skip", "Saltar"], ["remap", "Remapear"], ["air", "→ Aire"]]

export function BulkRules({ open, groups, onClose, onApply }: { open: boolean; groups: SchBulkGroup[]; onClose?: () => void; onApply?: (actions: Record<string, string>) => void }) {
  const [actions, setActions] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    if (!open) setActions({})
  }, [open])
  if (!open) return null
  const set = (ns: string, a: string) => setActions((p) => ({ ...p, [ns]: a }))
  const none = groups.every((g) => (actions[g.namespace] || "skip") === "skip")
  return (
    <div className="fixed inset-0 z-[950] flex justify-end bg-black/60 animate-[schfade_0.18s_ease] motion-reduce:animate-none" onClick={onClose}>
      <aside className="flex h-full w-[min(440px,100%)] flex-col border-l-2 border-solid border-accent bg-panel [box-shadow:0_0_60px_rgba(0,0,0,0.5)] animate-[schslide_0.24s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Reglas en lote">
        <header className="relative border-b border-solid border-line px-[18px] pb-[15px] pt-[18px]">
          <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-[14px] top-[14px] border-0 bg-transparent p-1 text-txt-dim hover:text-txt">
            <Icon name="x" size={16} />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-bright">En lote</span>
          <h3 className="my-[5px] font-display text-[24px] font-extrabold italic text-txt">Reglas por espacio de nombres</h3>
          <p className="m-0 max-w-[40ch] text-[13px] text-txt-muted">Resuelve bloques ausentes de un mod entero de una sola vez.</p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] py-[14px]">
          {groups.map((g) => {
            const a = actions[g.namespace] || "skip"
            const would = a === "air" ? g.entries.length : a === "remap" ? g.remap : 0
            return (
              <div key={g.namespace} className="border border-solid border-line bg-base-2 p-[11px]">
                <div className="mb-[9px] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <BlockThumb id={g.namespace + ":block"} size={20} />
                    <span className="font-mono text-[13px] font-semibold text-txt">{g.namespace}</span>
                    <span className="bg-panel-2 px-1.5 py-px font-mono text-[10px] text-txt-muted">{g.entries.length}</span>
                  </span>
                  {a !== "skip" && would > 0 ? (
                    <span className="flex items-center gap-1 font-mono text-[10.5px] text-ok">
                      <Icon name="check" size={11} />
                      resuelve {would}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BULK_ACTS.map(([k, lbl]) => {
                    const dis = k === "remap" && g.remap === 0
                    return (
                      <button key={k} type="button" disabled={dis} onClick={() => set(g.namespace, k)} className={cn("border border-solid p-[7px] font-mono text-[11px] transition-[color,border-color] duration-[140ms] disabled:cursor-default disabled:opacity-40", a === k ? "border-accent bg-accent-soft text-accent-bright" : "border-line bg-panel text-txt-muted hover:border-line-2 hover:text-txt")}>
                        {lbl}
                        {k === "remap" && g.remap > 0 ? ` (${g.remap})` : ""}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <footer className="flex flex-none justify-end gap-2.5 border-t border-solid border-line px-[18px] py-[13px]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="pri" size="sm" icon="check" disabled={none} onClick={() => onApply && onApply(actions)}>
            Aplicar reglas
          </Button>
        </footer>
      </aside>
    </div>
  )
}
