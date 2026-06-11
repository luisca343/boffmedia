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
        "flex items-center gap-[.5rem] p-[.55rem_.6rem] flex-1 rounded-[var(--radius)] border font-inherit text-t-xs font-bold cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)] whitespace-nowrap min-w-0",
        used ? "opacity-[.45] cursor-not-allowed" : "",
      ].join(" ")}
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
      {hotkey ? (
        <span
          className="font-mono font-bold text-[.6rem] w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[5px]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--surface-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
        >
          {hotkey}
        </span>
      ) : (
        <span
          className="font-mono font-bold text-[.6rem] w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[5px]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--surface-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
        >
          T
        </span>
      )}
      <BSTera type={type} size="1.05em" />
      <span className="overflow-hidden text-ellipsis">{used ? "Tera usado" : armed ? `Tera ${type} ✓` : `Tera ${type}`}</span>
    </button>
  )
}
