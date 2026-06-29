"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import type { SchematicSummary } from "../../_lib/types";

interface FilePickerProps {
  label: string;
  schematic?: SchematicSummary;
  loading: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePicker({ label, schematic, loading, disabled, onPick }: FilePickerProps) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink-muted">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept=".schem,.schematic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start h-9"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {loading ? "…" : t("setup.pickFile")}
      </Button>

      <div className="text-[11px] text-ink-dim min-h-[16px]">
        {schematic && (
          <span className="text-success">
            ✓ {schematic.fileName} · {formatSize(schematic.fileSize)} ·{" "}
            {schematic.dimensions.x}×{schematic.dimensions.y}×{schematic.dimensions.z}
          </span>
        )}
      </div>
    </div>
  );
}
