"use client"

import { tyVar } from "./bs-data"
import { Icon } from "./icon"

interface BSXPlanAction {
  kind: string
  move?: { name: string; type: string }
  target?: { spread?: string }
  targetName?: string
  toName?: string
  tera?: boolean
}

interface BSXPlanChipProps {
  tag: string
  action?: BSXPlanAction | null
  onClear?: () => void
  hint?: string
}

export function BSXPlanChip({ tag, action, onClear, hint }: BSXPlanChipProps) {
  if (!action) {
    return (
      <div
        className="flex items-center gap-[.45rem] p-[var(--bsx-pad-sm)] min-w-0 rounded-[var(--radius)] text-t-xs"
        style={{ background: "var(--layer-2)", border: "1px dashed var(--border-strong)" }}
      >
        <span
          className="font-mono font-bold text-t-4xs w-[15px] h-[15px] inline-grid place-items-center rounded-[var(--radius-sm)] shrink-0"
          style={{
            background: "color-mix(in srgb, var(--secondary) 24%, transparent)",
            color: "var(--secondary-hover)",
            border: "1px solid color-mix(in srgb, var(--secondary) 45%, transparent)",
          }}
        >
          {tag}
        </span>
        <span style={{ color: "var(--text-dim)", fontSize: "var(--t-2xs)" }}>{hint || "Sin orden"}</span>
      </div>
    )
  }

  const isMove = action.kind === "move"
  const tgt = !isMove ? null
    : action.target && action.target.spread ? (action.target.spread === "all" ? "todos" : "ambos rivales")
    : action.targetName || ""

  const c = isMove && action.move ? tyVar(action.move.type) : "var(--secondary)"

  return (
    <div
      className="flex items-center gap-[.45rem] p-[var(--bsx-pad-sm)] min-w-0 rounded-[var(--radius)] text-t-xs"
      style={{
        "--_c": c,
        background: `color-mix(in srgb, ${c} 9%, var(--layer-2))`,
        border: `1px solid color-mix(in srgb, ${c} 38%, var(--border))`,
      } as React.CSSProperties}
    >
      <span
        className="font-mono font-bold text-t-4xs w-[15px] h-[15px] inline-grid place-items-center rounded-[var(--radius-sm)] shrink-0"
        style={{
          background: `color-mix(in srgb, var(--secondary) 24%, transparent)`,
          color: "var(--secondary-hover)",
          border: "1px solid color-mix(in srgb, var(--secondary) 45%, transparent)",
        }}
      >
        {tag}
      </span>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-[.35rem]">
        {isMove ? (
          <>
            {action.tera && (
              <span
                className="font-mono text-t-4xs tracking-[.08em] px-[.35em] py-[.12em] rounded-[var(--radius-sm)] shrink-0"
                style={{ background: "var(--purple-500)", color: "#fff" }}
              >
                TERA
              </span>
            )}
            <b>{action.move!.name}</b>
            {tgt ? <span>→ {tgt}</span> : null}
          </>
        ) : (
          <>Cambio → <b>{action.toName}</b></>
        )}
      </span>
      {onClear && (
        <button
          className="ml-auto shrink-0 w-[20px] h-[20px] grid place-items-center border-0 rounded-[var(--radius-sm)] cursor-pointer"
          style={{ background: "transparent", color: "var(--text-dim)" }}
          onClick={onClear}
          aria-label="Borrar orden"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  )
}
