"use client";

import { useRef } from "react";
import { DropZone, type DropZoneFile } from "@/components/boffmedia/ui/schematic";
import type { SchematicSummary } from "../../_lib/types";

interface FilePickerProps {
  schematic?: SchematicSummary;
  disabled: boolean;
  onPick: (file: File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toDropFile(s: SchematicSummary | undefined): DropZoneFile | null {
  if (!s) return null;
  return {
    name: s.fileName,
    size: formatSize(s.fileSize),
    dims: `${s.dimensions.x}×${s.dimensions.y}×${s.dimensions.z}`,
  };
}

/** Schematic file picker rendered with the {@link DropZone} design piece. */
export function FilePicker({ schematic, disabled, onPick }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".schem,.schematic,.litematic,.nbt,.mca,.prefab.json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <DropZone file={toDropFile(schematic)} onPick={() => !disabled && inputRef.current?.click()} />
    </>
  );
}
