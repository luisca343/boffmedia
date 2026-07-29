"use client"

import { useRef } from "react"
import { Banner, DataList, DropZone } from "@/components/boffmedia/primitives"
import type { WorldIdSummary } from "@/lib/schematic/types"

export interface WorldIdPickerLabels {
  /** Headline in the empty drop zone. */
  dropHere: string
  /** Why this is being asked for at all. */
  hint: string
  /** Badge text once a level.dat is attached. */
  loaded: string
  world: string
  ids: string
  mods: string
  /** Shown while ids are still unresolved; already interpolated by the caller. */
  unresolved: string
  /** Empty-state warning: the document has unnamed ids and NEEDS a world. */
  needed: string
  /** The same-world caveat — a wrong file yields wrong names, not no names. */
  caveat: string
  detach: string
}

export interface WorldIdPickerProps {
  worldIds?: WorldIdSummary
  /** Ids the loaded document could not name; drives the prompt vs. confirmation. */
  unknownIdCount: number
  labels: WorldIdPickerLabels
  disabled?: boolean
  onPick: (file: File) => void
  onDetach: () => void
}

/**
 * Attaches the `level.dat` of the world a pre-1.13 file was cut from.
 *
 * Legacy schematics store mod blocks as bare integers that only that world's
 * registry can name, so this is the difference between `unknown:block_2178` and
 * `rustic:granite_pillar`. It is deliberately its own step rather than part of
 * the schematic drop zone: the same world names every file cut from it, and the
 * caveat below only makes sense attached to this control.
 */
export function WorldIdPicker({
  worldIds,
  unknownIdCount,
  labels,
  disabled,
  onPick,
  onDetach,
}: WorldIdPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".dat"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ""
        }}
      />
      {worldIds ? (
        <>
          <DataList
            rows={[
              { label: labels.world, value: worldIds.worldName ?? "—" },
              { label: labels.ids, value: worldIds.moddedCount.toLocaleString(), mono: true },
              ...(worldIds.modCount !== undefined
                ? [{ label: labels.mods, value: String(worldIds.modCount), mono: true }]
                : []),
            ]}
          />
          {unknownIdCount > 0 && (
            <Banner tone="warn" className="text-[12.5px]">
              {labels.unresolved}
            </Banner>
          )}
          <button
            type="button"
            className="self-start font-mono text-[11px] text-txt-dim underline underline-offset-2 hover:text-txt"
            onClick={onDetach}
            disabled={disabled}
          >
            {labels.detach}
          </button>
        </>
      ) : (
        <>
          {unknownIdCount > 0 && (
            <Banner tone="warn" className="text-[12.5px]">
              {labels.needed}
            </Banner>
          )}
          <DropZone
            file={null}
            label={labels.dropHere}
            hint={labels.hint}
            loadedLabel={labels.loaded}
            onPick={() => !disabled && inputRef.current?.click()}
          />
          <p className="font-mono text-[11px] leading-relaxed text-txt-dim">{labels.caveat}</p>
        </>
      )}
    </>
  )
}
