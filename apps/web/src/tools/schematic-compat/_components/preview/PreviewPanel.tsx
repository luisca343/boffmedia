"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/boffmedia/primitives";
import { AxisSlider, type SchStatus } from "../ui/sch-kit";
import { useToolStore } from "../../_store/tool.store";
import type { PreviewMode } from "../../_store/tool.store";
import { convertedPlan, resultPlan } from "./previewPlan";

/** Maps an engine status to its `diff.*` translation key (mirrors DiffPanel). */
const STATUS_KEY: Record<SchStatus, string> = {
  safe: "diff.safe",
  renamed: "diff.renamed",
  "state-changed": "diff.stateChanged",
  missing: "diff.missing",
  "mod-only": "diff.modOnly",
};

function Loading3D() {
  const t = useTranslations("games.minecraft.schematicCompat");
  return (
    <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-txt-dim">
      {t("preview.loading3d")}
    </div>
  );
}

// R3F uses WebGL — skip SSR entirely.
const SchematicViewer3D = dynamic(
  () => import("./SchematicViewer3D").then((m) => ({ default: m.SchematicViewer3D })),
  {
    ssr: false,
    loading: () => <Loading3D />,
  },
);

function PreviewButton({
  on,
  onClick,
  disabled,
  title,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 py-[5px] px-[9px] border border-solid border-transparent bg-transparent font-mono text-[11px] cursor-pointer transition-colors duration-[140ms] disabled:opacity-40",
        on ? "text-accent-bright bg-accent-soft border-accent-line" : "text-txt-dim hover:text-txt-muted",
      )}
    >
      {children}
    </button>
  );
}

function Inspector() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const previewMode = useToolStore((s) => s.previewMode);

  if (!selectedBlockId) {
    return <p className="text-[12px] text-txt-dim leading-[1.5] m-0">{t("preview.inspectorEmpty")}</p>;
  }

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const block = group?.block;
  const diffEntry = diff?.entries.find((e) => e.block.id === selectedBlockId);
  const stateEntries = block ? Object.entries(block.states) : [];

  // In converted/result mode, surface the block this is being converted into.
  const plan =
    (previewMode === "converted" || previewMode === "result") && diff
      ? previewMode === "converted"
        ? convertedPlan(selectedBlockId, diffEntry?.status, diffEntry?.autoCandidate?.id, resolutions[selectedBlockId]?.targetId)
        : resultPlan(selectedBlockId, diffEntry?.status, diffEntry?.autoCandidate?.id, resolutions[selectedBlockId]?.targetId)
      : null;
  const convertsTo = plan && plan.textureId !== selectedBlockId ? plan.textureId : null;

  return (
    <>
      <div className="font-mono text-[12.5px] font-semibold text-txt mb-2 break-all">{selectedBlockId}</div>
      {convertsTo && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] mb-2 break-all">
          <Icon name="arrow" size={13} className="shrink-0 text-accent-bright" />
          <span className="text-accent-bright">{convertsTo}</span>
        </div>
      )}
      {stateEntries.length > 0 && (
        <div className="grid gap-[3px] mb-1.5">
          {stateEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between font-mono text-[11px]">
              <span className="text-txt-muted">{k}</span>
              <span className="text-txt-dim">{v}</span>
            </div>
          ))}
        </div>
      )}
      {diffEntry && (
        <p className="text-[11.5px] text-txt-dim m-0">
          {t("diff.instances", { count: diffEntry.instanceCount })} ·{" "}
          <span className="capitalize font-semibold text-txt-muted">{t(STATUS_KEY[diffEntry.status])}</span>
        </p>
      )}
    </>
  );
}

function ModeSwitch({
  mode,
  convertedEnabled,
  onChange,
}: {
  mode: PreviewMode;
  convertedEnabled: boolean;
  onChange: (m: PreviewMode) => void;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const segment = (value: PreviewMode, label: string, disabled?: boolean) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value)}
      title={disabled ? t("preview.modeDisabled") : undefined}
      className={cn(
        "py-1 px-2 font-mono text-[11px] cursor-pointer transition-colors duration-[140ms] disabled:opacity-40 disabled:cursor-not-allowed",
        mode === value ? "bg-accent-soft text-accent-bright" : "text-txt-dim hover:text-txt",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 border border-line bg-base">
      {segment("source", t("preview.modeSource"))}
      {segment("result", t("preview.modeResult"), !convertedEnabled)}
      {segment("converted", t("preview.modeDiff"), !convertedEnabled)}
    </div>
  );
}

function LegendDot({ color, label, faded }: { color?: string; label: string; faded?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", faded && "opacity-60")}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={color ? { background: color } : { background: "var(--dim)", opacity: 0.4 }}
      />
      {label}
    </span>
  );
}

export function PreviewPanel() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const schematic = useToolStore((s) => s.schematic);
  const layerY = useToolStore((s) => s.layerY);
  const hideUnchanged = useToolStore((s) => s.hideUnchanged);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const previewMode = useToolStore((s) => s.previewMode);
  const diff = useToolStore((s) => s.diff);
  const setLayerY = useToolStore((s) => s.setLayerY);
  const setHideUnchanged = useToolStore((s) => s.setHideUnchanged);
  const setPreviewMode = useToolStore((s) => s.setPreviewMode);

  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);

  const maxLayerY = schematic ? schematic.dimensions.y - 1 : 0;
  const convertedView = previewMode === "converted" && !!diff;
  const resultView = previewMode === "result" && !!diff;

  return (
    <div ref={rootRef} className="flex h-full flex-col bg-base-2">
      {/* header */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 h-[46px] border-b border-line">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-txt-muted">{t("preview.title")}</span>
        <ModeSwitch mode={previewMode} convertedEnabled={!!diff} onChange={setPreviewMode} />
        <div className="flex-1" />
        {resultView && (
          <PreviewButton on={hideUnchanged} onClick={() => setHideUnchanged(!hideUnchanged)} title={t("preview.onlyChangesHint")}>
            {t("preview.onlyChanges")}
          </PreviewButton>
        )}
        <PreviewButton
          onClick={toggleFullscreen}
          disabled={!schematic}
          title={isFullscreen ? t("preview.exitFullscreen") : t("preview.fullscreen")}
        >
          <Icon name={isFullscreen ? "exitFullscreen" : "fullscreen"} size={15} />
        </PreviewButton>
      </div>

      {/* stage */}
      <div
        className="relative flex-1 min-h-[200px] overflow-hidden"
        style={{ background: "radial-gradient(120% 120% at 50% 30%, var(--panel) 0%, var(--bg) 80%)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            opacity: 0.35,
            maskImage: "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 85%)",
          }}
        />
        {schematic ? (
          <SchematicViewer3D />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <div
              className="grid place-items-center motion-safe:animate-[bm-bob_5s_ease-in-out_infinite]"
              style={{ filter: "drop-shadow(0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent))" }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <g stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinejoin="round">
                  <path d="M60 16 L100 38 L60 60 L20 38 Z" fill="color-mix(in srgb, var(--accent) 30%, transparent)" />
                  <path d="M20 38 L60 60 L60 104 L20 82 Z" fill="color-mix(in srgb, var(--accent) 15%, transparent)" />
                  <path d="M100 38 L60 60 L60 104 L100 82 Z" fill="color-mix(in srgb, var(--accent) 9%, transparent)" />
                </g>
                <g stroke="color-mix(in srgb, var(--accent-bright) 45%, transparent)" strokeWidth="0.75">
                  <path d="M40 27 L80 49 M80 27 L40 49" />
                </g>
              </svg>
            </div>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-txt-dim">{t("preview.emptyCaption")}</span>
          </div>
        )}
        {convertedView ? (
          <div className="absolute left-1/2 bottom-2.5 -translate-x-1/2 flex items-center gap-2.5 font-mono text-[10px] text-txt-dim whitespace-nowrap py-1 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line">
            <LegendDot color="var(--ok)" label={t("preview.legendModified")} />
            <LegendDot color="var(--bad)" label={t("preview.legendUnresolved")} />
            <LegendDot label={t("preview.legendUnchanged")} faded />
          </div>
        ) : resultView ? (
          <div className="absolute left-1/2 bottom-2.5 -translate-x-1/2 font-mono text-[10px] text-txt-dim whitespace-nowrap py-1 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line">
            {t("preview.resultCaption")}
          </div>
        ) : (
          <div className="absolute left-1/2 bottom-2.5 -translate-x-1/2 font-mono text-[10px] text-txt-dim whitespace-nowrap py-1 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line">
            {selectedBlockId ? t("preview.selectedHighlighted") : t("preview.clickToInspect")}
          </div>
        )}
      </div>

      {/* layer slider */}
      <AxisSlider axis="Y" value={layerY} max={maxLayerY} onChange={setLayerY} />

      {/* inspector */}
      <div className="shrink-0 border-t border-line py-3 px-3 min-h-[92px]">
        <Inspector />
      </div>
    </div>
  );
}
