"use client"

import { tyVar } from "./bs-data"
import { BSTera } from "./bs-tera"

interface BSXTeraBtnProps {
  type: string
  armed?: boolean
  used?: boolean
  onToggle?: () => void
  hotkey?: string
}

export function BSXTeraBtn({ type, armed, used, onToggle, hotkey }: BSXTeraBtnProps) {
  const c = tyVar(type)

  return (
    <button
      className={[
        "bsx-focus flex items-center gap-[.5rem] p-[var(--bsx-pad-md)] flex-1 rounded-[var(--radius)] border font-inherit text-t-xs font-bold cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)] whitespace-nowrap min-w-0",
        used ? "opacity-[.45] cursor-not-allowed" : "",
      ].filter(Boolean).join(" ")}
      aria-pressed={!!armed}
      aria-disabled={used || undefined}
      aria-label={used ? "Teracristal ya usado" : `Teracristalizar a tipo ${type}${armed ? ", activado" : ""}`}
      style={{
        "--_c": c,
        background: armed ? `color-mix(in srgb, ${c} 16%, var(--surface-2))` : "var(--surface-2)",
        borderColor: `color-mix(in srgb, ${c} 40%, var(--border))`,
        color: "var(--text)",
        boxShadow: armed ? `0 0 0 1px ${c} inset, 0 0 18px -8px ${c}` : undefined,
      } as React.CSSProperties}
      disabled={used}
      onClick={onToggle}
      title={used ? "Teracristal ya usado" : "Teracristalizar este turno"}
    >
      <span
        className="font-mono font-bold text-t-3xs w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[var(--radius-sm)]"
        style={{ background: "color-mix(in srgb, #000 30%, var(--surface-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
      >
        {hotkey || "T"}
      </span>
      <BSTera type={type} size="1.05em" />
      <span className="overflow-hidden text-ellipsis">{used ? "Tera usado" : armed ? `Tera ${type} ✓` : `Tera ${type}`}</span>
    </button>
  )
}
