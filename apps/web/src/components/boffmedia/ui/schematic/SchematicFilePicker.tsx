"use client"

import { useRef } from "react"
import { DropZone, type DropZoneFile } from "@/components/boffmedia/primitives"
import { schematicAccept, schematicHint } from "@/lib/schematic/file-formats"
import type { SchematicSummary } from "@/lib/schematic/types"

export interface SchematicFilePickerLabels {
  /** Headline in the empty drop zone. */
  dropHere: string
  /** Badge text once a file is loaded. */
  loaded: string
}

export interface SchematicFilePickerProps {
  schematic?: SchematicSummary
  labels: SchematicFilePickerLabels
  disabled?: boolean
  onPick: (file: File) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toDropFile(s: SchematicSummary | undefined): DropZoneFile | null {
  if (!s) return null
  return {
    name: s.fileName,
    size: formatSize(s.fileSize),
    meta: `${s.dimensions.x}×${s.dimensions.y}×${s.dimensions.z}`,
  }
}

/**
 * Schematic file picker on top of the {@link DropZone} primitive. The accepted
 * formats are derived from the registered adapters, so a tool never restates
 * them and a newly supported loader shows up here for free.
 */
export function SchematicFilePicker({
  schematic,
  labels,
  disabled,
  onPick,
}: SchematicFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={schematicAccept()}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ""
        }}
      />
      <DropZone
        file={toDropFile(schematic)}
        label={labels.dropHere}
        hint={schematicHint()}
        loadedLabel={labels.loaded}
        onPick={() => !disabled && inputRef.current?.click()}
      />
    </>
  )
}
