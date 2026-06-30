"use client";

import { useState } from "react";
import { BoffButton } from "@/components/boffmedia/primitives/button";
import { SchIcon } from "@/components/boffmedia/ui/schematic";
import type { GameId } from "../../_lib/adapters";
import { useToolStore } from "../../_store/tool.store";
import { EnvPicker } from "./EnvPicker";
import { FilePicker } from "./FilePicker";

interface SetupPanelProps {
  engineReady: boolean;
  onScanSource: (gameId: GameId, files: File[]) => void;
  onScanTarget: (gameId: GameId, files: File[]) => void;
  onPickSchematic: (file: File) => void;
  onAnalyze: () => void;
}

const GUIDE_STEPS = [
  "Elige el entorno de origen (instancia + mods).",
  "Elige el entorno de destino (versión o juego).",
  "Carga tu esquema.",
  "Analiza para ver el diff de compatibilidad.",
  "Resuelve y exporta al nuevo formato.",
];

function GroupHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-muted font-bold">{title}</span>
      <span className="flex-1 h-px bg-edge" />
    </div>
  );
}

export function SetupPanel({
  engineReady,
  onScanSource,
  onScanTarget,
  onPickSchematic,
  onAnalyze,
}: SetupPanelProps) {
  const {
    sourceGame,
    targetGame,
    sourceReg,
    targetReg,
    schematic,
    sourceScan,
    targetScan,
    isLoadingSource,
    isLoadingTarget,
    isAnalyzing,
    diff,
    error,
    setSourceGame,
    setTargetGame,
  } = useToolStore();
  const [guide, setGuide] = useState(false);

  const analyzed = !!diff;
  const canAnalyze =
    engineReady && !!schematic && !!sourceReg && !!targetReg && !isAnalyzing && !analyzed;

  return (
    <div className="p-4 flex flex-col gap-[1.05rem]">
      {/* onboarding guide */}
      <div className="border border-edge rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--layer-2)_60%,transparent)] overflow-hidden">
        <button
          type="button"
          onClick={() => setGuide((v) => !v)}
          className="flex items-center gap-[0.55rem] w-full py-[0.6rem] px-[0.7rem] bg-transparent border-0 cursor-pointer text-ink-muted text-left text-[length:var(--t-xs)] transition-colors hover:text-ink"
        >
          <SchIcon name="info" size={16} className="text-[color:var(--accent-bright)] shrink-0" />
          <span className="flex-1 font-semibold">Cómo funciona</span>
          <SchIcon name="chevron" size={16} style={{ transform: guide ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>
        {guide ? (
          <div className="py-[0.3rem] px-[0.8rem] pb-[0.7rem] border-t border-edge">
            <ol className="mt-2 p-0 list-none flex flex-col gap-2">
              {GUIDE_STEPS.map((tt, i) => (
                <li key={i} className="flex gap-[0.55rem] text-[length:var(--t-xs)] text-ink-dim leading-[1.45]">
                  <span className="grid place-items-center w-4 h-4 shrink-0 mt-px rounded-full bg-[var(--accent-soft)] text-[color:var(--accent-bright)] font-mono text-[9px] font-bold">
                    {i + 1}
                  </span>
                  <span>{tt}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      {/* environments */}
      <div className="flex flex-col gap-[0.6rem]">
        <GroupHead title="Entornos" />
        <EnvPicker
          role="source"
          roleLabel="Origen"
          game={sourceGame}
          onGameChange={setSourceGame}
          registry={sourceReg}
          scan={sourceScan}
          loading={isLoadingSource}
          disabled={!engineReady}
          onPick={(files) => onScanSource(sourceGame, files)}
        />
        <div className="flex items-center justify-center gap-2 text-ink-dim -my-[0.15rem]">
          <span className="w-[26px] h-px bg-edge-strong" />
          <SchIcon name="arrow" size={16} style={{ transform: "rotate(90deg)" }} />
          <span className="w-[26px] h-px bg-edge-strong" />
        </div>
        <EnvPicker
          role="target"
          roleLabel="Destino"
          game={targetGame}
          onGameChange={setTargetGame}
          registry={targetReg}
          scan={targetScan}
          loading={isLoadingTarget}
          disabled={!engineReady}
          onPick={(files) => onScanTarget(targetGame, files)}
        />
      </div>

      {/* schematic */}
      <div className="flex flex-col gap-[0.6rem]">
        <GroupHead title="Esquema" />
        <FilePicker schematic={schematic} disabled={!engineReady} onPick={onPickSchematic} />
      </div>

      <BoffButton variant="primary" block disabled={!canAnalyze} onClick={onAnalyze}>
        <SchIcon name="play" size={17} />
        {isAnalyzing ? "Analizando…" : analyzed ? "Analizado ✓" : "Analizar compatibilidad"}
      </BoffButton>

      {error && (
        <div className="flex items-start gap-2 py-[0.6rem] px-[0.7rem] rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--rose-500)_45%,transparent)] bg-[color-mix(in_srgb,var(--rose-500)_10%,transparent)] text-[color:var(--rose-400)] text-[length:var(--t-xs)] leading-[1.4]">
          <SchIcon name="alert" size={16} className="shrink-0 mt-px" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
