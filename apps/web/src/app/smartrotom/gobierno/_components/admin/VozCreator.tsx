"use client"

import { useRef, useState } from "react"
import { SmartrotomService } from "@/services/api/smartrotom/smartrotomService"
import { Bar, Button, Card, Field, Icon, Sunken, toast } from "../ui"
import { MCText, MC_STYLE_CODES, MC_SWATCHES } from "./MCText"

// The same 16 game colours MCText renders with, in their true (bright) Minecraft hue —
// used only as literal swatch fills here, the sanctioned exception for §-code data.
const MC_HEX: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
}
const LIGHT_SWATCH = new Set(["6", "7", "3", "a", "b", "d", "e", "f"])

/**
 * Creates a new ArceuSpeak persona via the pre-existing `/arceuspeak` endpoint — Megafonía
 * still uses this catalog for who can speak; only the send+history half moved to the new
 * Gobierno megafonia endpoints.
 */
export function VozCreator({ onCreated, onClose }: { onCreated: (value: string) => void; onClose: () => void }) {
  const [name, setName] = useState("")
  const [fmt, setFmt] = useState("")
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const insert = (code: string) => {
    const el = ref.current
    const pos = el?.selectionStart ?? fmt.length
    const next = fmt.slice(0, pos) + "§" + code + fmt.slice(pos)
    setFmt(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(pos + 2, pos + 2)
    })
  }

  const create = async () => {
    if (!name.trim() || !fmt.trim() || saving) return
    setSaving(true)
    const value = name.trim().toLowerCase().replace(/\s+/g, "_")
    try {
      const res = await SmartrotomService.postArceuSpeak({ name: name.trim(), value, format: fmt.trim() })
      if (res.success === false || (res.statusCode && res.statusCode >= 400)) {
        throw new Error(res.userMessage ?? "No se pudo crear la voz.")
      }
      toast(`Voz «${name.trim()}» creada`, "ok", "check")
      onCreated(value)
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo crear la voz.", "danger", "alert")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <Bar
        icon="badge"
        dep="seguridad"
        right={
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar creador de voces"
            className="text-gt-ink-400 transition-colors hover:text-gt-ink-900"
          >
            <Icon name="x" size={16} />
          </button>
        }
      >
        Nueva voz oficial
      </Bar>
      <div className="p-4">
        <div className="mb-2.5">
          <Field value={name} onChange={setName} placeholder="Nombre (ej. Liga Teras)" />
        </div>
        <div className="mb-2.5">
          <input
            ref={ref}
            value={fmt}
            onChange={(e) => setFmt(e.target.value)}
            placeholder="Formato §l§f[§6Nombre§f]"
            aria-label="Formato §-coded"
            className="w-full rounded-gt-sm border border-gt-line-strong bg-gt-paper-0 px-3 py-[9px] font-gt-mono text-[13px] text-gt-ink-900 placeholder:text-gt-ink-400 focus:border-gt-accent focus:outline-none focus:ring-[3px] focus:ring-gt-accent-tint"
          />
        </div>

        <div className="mb-1.5 font-gt-mono text-[8.5px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
          Colores
        </div>
        <div className="mb-2.5 grid grid-cols-8 gap-1">
          {MC_SWATCHES.map(([c, n]) => (
            <button
              key={c}
              type="button"
              title={n}
              onClick={() => insert(c)}
              style={{ background: MC_HEX[c], color: LIGHT_SWATCH.has(c) ? "#000" : "#fff" }}
              className="h-6 rounded border border-black/20 font-gt-mono text-[9px]"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mb-1.5 font-gt-mono text-[8.5px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
          Estilos
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {MC_STYLE_CODES.map(([c, n]) => (
            <button
              key={c}
              type="button"
              onClick={() => insert(c)}
              className="rounded border border-gt-line-strong bg-gt-paper-1 px-[9px] py-1 font-gt-mono text-[10.5px] text-gt-ink-600"
            >
              {n} §{c}
            </button>
          ))}
        </div>

        <Sunken className="mb-3 px-3 py-2.5">
          <div className="mb-1 font-gt-mono text-[8.5px] uppercase tracking-[.14em] text-gt-ink-400">Resultado</div>
          <div className="text-sm">
            <MCText format={fmt} fallback="…" />
          </div>
        </Sunken>

        <Button icon="check" className="w-full" disabled={!name.trim() || !fmt.trim() || saving} onClick={create}>
          {saving ? "Creando…" : "Crear voz"}
        </Button>
      </div>
    </Card>
  )
}
