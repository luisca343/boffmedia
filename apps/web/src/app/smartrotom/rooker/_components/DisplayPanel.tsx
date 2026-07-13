"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"
import { Icon, Modal } from "./ui"
import { useDisplayStore } from "../_stores/displayStore"
import { ACCENTS, type RookerAccent } from "../_utils/display"

/**
 * "Pantalla" — Rooker's display settings, modelled on the dialog Twitter ships.
 *
 * The one thing it deliberately does NOT offer is light vs dark. That belongs to the
 * platform (Ajustes → Temas), and an app that kept its own copy would fight the picker
 * (SMARTROTOM_V3 §2b). What the reader chooses here is *which dark* — Tenue or Oscuro —
 * and that row is disabled in light mode, with a line saying where the switch actually
 * lives. Everything else (accent, face, density, card style, reactions) is Rooker's own
 * identity and has no platform equivalent.
 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[13px] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">{label}</div>
      {children}
    </div>
  )
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className={cn("flex gap-2", disabled && "pointer-events-none opacity-50")}>
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={cn(
              "flex-1 rounded-rk-md border px-3 py-2.5 text-[14px] font-bold transition-colors",
              on
                ? "border-rk-accent bg-rk-accent/12 text-rk-fg"
                : "border-rk-line-strong bg-rk-card text-rk-fg-muted hover:bg-rk-hover",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function DisplayPanel({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const mode = useRotomMode()
  const d = useDisplayStore()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pantalla"
        className={cn(
          "text-rk-fg transition-colors hover:bg-rk-hover",
          compact
            ? "grid h-8 w-8 place-items-center rounded-full text-rk-fg-muted"
            : "flex w-fit max-w-full items-center gap-[18px] rounded-rk-pill px-4 py-[11px] text-[20px]",
        )}
      >
        <Icon name="settings" size={compact ? 20 : 26} stroke={2} />
        {!compact && <span className="hidden xl:inline">Pantalla</span>}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} label="Ajustes de pantalla">
        <div className="flex items-center justify-between border-b border-rk-line px-4 py-3">
          <h2 className="text-[17px] font-extrabold text-rk-fg">Pantalla</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full text-rk-fg transition-colors hover:bg-rk-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="rk-scroll max-h-[70vh] space-y-6 overflow-y-auto p-4">
          <Row label="Fondo">
            <Choice
              value={d.darkness}
              onChange={d.setDarkness}
              disabled={mode === "light"}
              options={[
                { value: "dim", label: "Tenue" },
                { value: "lightsout", label: "Oscuro" },
              ]}
            />
            <p className="text-[12.5px] leading-relaxed text-rk-fg-subtle">
              {mode === "light"
                ? "Estás en modo claro. El claro y el oscuro se eligen en Ajustes → Temas, para todo SmartRotom."
                : "Elige qué tan oscuro. El cambio a claro se hace en Ajustes → Temas."}
            </p>
          </Row>

          <Row label="Color de acento">
            <div className="flex gap-2.5">
              {(Object.keys(ACCENTS) as RookerAccent[]).map((key) => {
                const on = d.accent === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => d.setAccent(key)}
                    aria-label={ACCENTS[key].label}
                    aria-pressed={on}
                    // The swatch IS the accent, so its colour is a runtime value and
                    // must be inline — a `bg-rk-${key}` class would never compile (§4).
                    style={{ background: `rgb(${ACCENTS[key].rgb})` }}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110",
                      on && "ring-2 ring-rk-fg ring-offset-2 ring-offset-rk-bg",
                    )}
                  >
                    {on && (
                      <Icon
                        name="check"
                        size={16}
                        stroke={3}
                        style={{ color: `rgb(${ACCENTS[key].fg})` }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </Row>

          <Row label="Tipografía">
            <Choice
              value={d.font}
              onChange={d.setFont}
              options={[
                { value: "sistema", label: "Sistema" },
                { value: "chirp", label: "Chirp" },
              ]}
            />
          </Row>

          <Row label="Densidad">
            <Choice
              value={d.density}
              onChange={d.setDensity}
              options={[
                { value: "comodo", label: "Cómodo" },
                { value: "compacto", label: "Compacto" },
              ]}
            />
          </Row>

          <Row label="Estilo de trino">
            <Choice
              value={d.cardStyle}
              onChange={d.setCardStyle}
              options={[
                { value: "plano", label: "Plano" },
                { value: "tarjeta", label: "Tarjeta" },
              ]}
            />
          </Row>

          <Row label="Reacciones">
            <Choice
              value={d.reactions}
              onChange={d.setReactions}
              options={[
                { value: "expresivas", label: "Expresivas" },
                { value: "simple", label: "Solo me gusta" },
              ]}
            />
            <p className="text-[12.5px] leading-relaxed text-rk-fg-subtle">
              Con «Solo me gusta» desaparece la bandeja de cinco reacciones y el botón se
              comporta como un me gusta normal.
            </p>
          </Row>
        </div>
      </Modal>
    </>
  )
}
