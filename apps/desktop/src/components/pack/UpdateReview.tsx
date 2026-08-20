import { useEffect, useMemo, useState } from "react"

import { Button, CatalogIcon, Checkbox, Modal, Spinner } from "@boffmedia/ui"

import { useT } from "../../i18n"
import type { ContentRow } from "./usePackContent"

// The review step between "Buscar actualizaciones" and the manifest actually
// changing. It exists because applying updates is the one bulk edit in the
// launcher with no undo: `replaceFile` overwrites the pinned version, and the
// old version id is gone the moment it is written. A player who wanted twenty
// mods bumped but NOT the one shader that just broke their pack has to be able
// to say so before the write, not after.
//
// Selection is per-row and starts all-on, which keeps the common case (bump
// everything) a single click while making the exception expressible.

export function UpdateReview({
  open,
  rows,
  busy,
  progress,
  onCancel,
  onConfirm,
}: {
  open: boolean
  /** Only rows carrying an `update`; the caller has already filtered. */
  rows: ContentRow[]
  busy: boolean
  /** "3/12" style counter while applying, or null when idle. */
  progress: string | null
  onCancel: () => void
  onConfirm: (chosen: ContentRow[]) => void
}) {
  const t = useT("updateReview")
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  // A fresh check produces a different set of rows, and carrying the previous
  // opt-outs over would silently skip a mod the player never excluded this
  // time round.
  useEffect(() => {
    if (open) setSkipped(new Set())
  }, [open])

  const chosen = useMemo(() => rows.filter((r) => !skipped.has(r.path)), [rows, skipped])

  const toggle = (path: string) => {
    setSkipped((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const allOn = skipped.size === 0
  const setAll = (on: boolean) => setSkipped(on ? new Set() : new Set(rows.map((r) => r.path)))

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      size="lg"
      title={`Actualizar ${rows.length} mod(s)`}
      footer={
        <div className="flex w-full items-center gap-3">
          {progress && (
            <span className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
              <Spinner size={12} /> {progress}
            </span>
          )}
          <span className="flex-1" />
          <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="pri"
            icon="download"
            loading={busy}
            disabled={busy || chosen.length === 0}
            onClick={() => onConfirm(chosen)}
          >
            {chosen.length === rows.length
              ? "Actualizar todo"
              : `Actualizar ${chosen.length}`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allOn}
            disabled={busy}
            onChange={setAll}
            label="Seleccionar todo"
          />
          <span className="flex-1" />
          <span className="font-mono text-[11px] text-txt-dim">
            {chosen.length}/{rows.length}
          </span>
        </div>

        <ul className="flex flex-col">
          {rows.map((row) => {
            const on = !skipped.has(row.path)
            return (
              <li
                key={row.path}
                className="flex items-center gap-3 border-b border-solid border-line py-2"
              >
                <Checkbox checked={on} disabled={busy} onChange={() => toggle(row.path)} />
                <CatalogIcon src={row.iconUrl} size={32} />
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                    {row.name}
                  </span>
                  {/* The from → to pair is the whole point of this screen: the
                      version being left behind is what tells a player whether
                      this is a patch bump or a major jump. */}
                  <span className="truncate font-mono text-[11px] text-txt-dim">
                    <span className="text-txt-muted">{row.update?.fromLabel ?? row.fileName}</span>
                    {" → "}
                    <span className="text-accent-bright">{row.update?.label}</span>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
