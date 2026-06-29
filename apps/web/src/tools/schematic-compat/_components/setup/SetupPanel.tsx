"use client";

import { useTranslations } from "next-intl";
import { Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Separator } from "@/components/ui/primitives/separator";
import { useToolStore } from "../../_store/tool.store";
import { EnvPicker } from "./EnvPicker";
import { FilePicker } from "./FilePicker";

interface SetupPanelProps {
  engineReady: boolean;
  onScanSource: (metaFiles: File[], jarFiles: File[]) => void;
  onScanTarget: (metaFiles: File[], jarFiles: File[]) => void;
  onPickSchematic: (file: File) => void;
  onAnalyze: () => void;
}

export function SetupPanel({
  engineReady,
  onScanSource,
  onScanTarget,
  onPickSchematic,
  onAnalyze,
}: SetupPanelProps) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const {
    sourceReg,
    targetReg,
    schematic,
    sourceScan,
    targetScan,
    isLoadingSource,
    isLoadingTarget,
    isLoadingSchematic,
    isAnalyzing,
    error,
  } = useToolStore();

  const canAnalyze =
    engineReady && !!schematic && !!sourceReg && !!targetReg && !isAnalyzing;

  return (
    <div className="p-4 space-y-4">
      <EnvPicker
        label={t("setup.sourceEnv")}
        registry={sourceReg}
        scan={sourceScan}
        loading={isLoadingSource}
        disabled={!engineReady}
        onPick={onScanSource}
      />

      <EnvPicker
        label={t("setup.targetEnv")}
        registry={targetReg}
        scan={targetScan}
        loading={isLoadingTarget}
        disabled={!engineReady}
        onPick={onScanTarget}
      />

      <Separator className="bg-edge/40" />

      <FilePicker
        label={t("setup.schematic")}
        schematic={schematic}
        loading={isLoadingSchematic}
        disabled={!engineReady}
        onPick={onPickSchematic}
      />

      <Button
        variant="default"
        className="w-full"
        disabled={!canAnalyze}
        onClick={onAnalyze}
      >
        <Play className="w-4 h-4 mr-2" />
        {isAnalyzing ? "…" : t("setup.analyze")}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-2 text-[11px] text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
