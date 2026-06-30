"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SchIcon, AxisSlider, STATUS_META } from "@/components/boffmedia/ui/schematic";
import { useToolStore } from "../../_store/tool.store";
import type { PreviewMode } from "../../_store/tool.store";
import { convertedPlan } from "./previewPlan";

// R3F uses WebGL — skip SSR entirely.
const SchematicViewer3D = dynamic(
  () => import("./SchematicViewer3D").then((m) => ({ default: m.SchematicViewer3D })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center text-[length:var(--t-xs)] text-ink-dim">
        Cargando motor 3D…
      </div>
    ),
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
        "inline-flex items-center gap-[0.3rem] py-[0.28rem] px-[0.5rem] rounded-[var(--radius)] border border-transparent bg-transparent text-[11px] cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)] disabled:opacity-40",
        on
          ? "text-[color:var(--accent-bright)] bg-[var(--accent-soft)]"
          : "text-ink-dim hover:text-ink hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
      )}
    >
      {children}
    </button>
  );
}

function Inspector() {
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const previewMode = useToolStore((s) => s.previewMode);

  if (!selectedBlockId) {
    return (
      <p className="text-[length:var(--t-xs)] text-ink-dim">
        Selecciona un bloque del diff o de la vista 3D para inspeccionarlo.
      </p>
    );
  }

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const block = group?.block;
  const diffEntry = diff?.entries.find((e) => e.block.id === selectedBlockId);
  const stateEntries = block ? Object.entries(block.states) : [];

  // In converted mode, surface the block this is being converted into.
  const plan =
    previewMode === "converted" && diff
      ? convertedPlan(selectedBlockId, diffEntry?.status, diffEntry?.autoCandidate?.id, resolutions[selectedBlockId]?.targetId)
      : null;
  const convertsTo = plan && plan.kind === "changed" && plan.textureId !== selectedBlockId ? plan.textureId : null;

  return (
    <>
      <div className="font-mono text-[length:var(--t-xs)] font-bold text-ink mb-2 break-all">{selectedBlockId}</div>
      {convertsTo && (
        <div className="flex items-center gap-[0.35rem] font-mono text-[11px] mb-2 break-all">
          <SchIcon name="arrow" size={13} className="shrink-0 text-[color:var(--accent-bright)]" />
          <span className="text-[color:var(--accent-bright)]">{convertsTo}</span>
        </div>
      )}
      {stateEntries.length > 0 && (
        <div className="flex flex-col gap-[0.15rem] mb-[0.4rem]">
          {stateEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-ink-muted">{k}</span>
              <span className="font-mono text-ink-dim">{v}</span>
            </div>
          ))}
        </div>
      )}
      {diffEntry && (
        <p className="text-[11px] text-ink-dim">
          {diffEntry.instanceCount.toLocaleString()} instancias ·{" "}
          <span className="capitalize">{STATUS_META[diffEntry.status].label}</span>
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
  const segment = (value: PreviewMode, label: string, disabled?: boolean) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value)}
      title={disabled ? "Ejecuta Analizar para comparar" : undefined}
      className={cn(
        "py-[0.25rem] px-[0.55rem] rounded-[calc(var(--radius)-2px)] text-[11px] font-medium cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)] disabled:opacity-40 disabled:cursor-not-allowed",
        mode === value
          ? "bg-[var(--accent-soft)] text-[color:var(--accent-bright)]"
          : "text-ink-dim hover:text-ink",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-[0.15rem] p-[0.15rem] rounded-[var(--radius)] border border-edge bg-[color-mix(in_srgb,var(--text)_4%,transparent)]">
      {segment("source", "Origen")}
      {segment("converted", "Convertido", !convertedEnabled)}
    </div>
  );
}

function LegendDot({ color, label, faded }: { color?: string; label: string; faded?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.3rem]", faded && "opacity-60")}>
      <span
        className="inline-block w-[0.5rem] h-[0.5rem] rounded-full"
        style={color ? { background: color } : { background: "var(--ink-dim)", opacity: 0.4 }}
      />
      {label}
    </span>
  );
}

export function PreviewPanel() {
  const schematic = useToolStore((s) => s.schematic);
  const layerY = useToolStore((s) => s.layerY);
  const diffOnlyMode = useToolStore((s) => s.diffOnlyMode);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const previewMode = useToolStore((s) => s.previewMode);
  const diff = useToolStore((s) => s.diff);
  const setLayerY = useToolStore((s) => s.setLayerY);
  const setDiffOnlyMode = useToolStore((s) => s.setDiffOnlyMode);
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

  return (
    <div ref={rootRef} className="flex h-full flex-col bg-layer-1">
      {/* header */}
      <div className="shrink-0 flex items-center gap-2 py-[0.7rem] px-[0.85rem] border-b border-edge">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-muted font-bold">Vista previa</span>
        <ModeSwitch mode={previewMode} convertedEnabled={!!diff} onChange={setPreviewMode} />
        <div className="flex-1" />
        <PreviewButton on={diffOnlyMode} onClick={() => setDiffOnlyMode(!diffOnlyMode)}>
          Solo diff
        </PreviewButton>
        <PreviewButton
          onClick={toggleFullscreen}
          disabled={!schematic}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          <SchIcon name={isFullscreen ? "minimize" : "maximize"} size={16} />
        </PreviewButton>
      </div>

      {/* stage */}
      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), var(--bg)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {schematic ? (
          <SchematicViewer3D />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.8rem] text-center p-6">
            <div
              className="grid place-items-center"
              style={{ filter: "drop-shadow(0 12px 30px color-mix(in srgb, var(--accent) 30%, transparent))" }}
            >
              <svg width="118" height="118" viewBox="0 0 120 120" fill="none">
                <g stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinejoin="round">
                  <path d="M60 16 L100 38 L60 60 L20 38 Z" fill="color-mix(in srgb, var(--accent) 26%, transparent)" />
                  <path d="M20 38 L60 60 L60 104 L20 82 Z" fill="color-mix(in srgb, var(--accent) 14%, transparent)" />
                  <path d="M100 38 L60 60 L60 104 L100 82 Z" fill="color-mix(in srgb, var(--accent) 8%, transparent)" />
                </g>
                <g stroke="color-mix(in srgb, var(--accent-bright) 50%, transparent)" strokeWidth="0.75">
                  <path d="M40 27 L80 49 M80 27 L40 49" />
                </g>
              </svg>
            </div>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-dim">
              Vista 3D del esquema · WebGL
            </span>
          </div>
        )}
        {convertedView ? (
          <div className="absolute left-1/2 bottom-[0.7rem] -translate-x-1/2 flex items-center gap-[0.7rem] font-mono text-[10px] text-ink-dim whitespace-nowrap py-[0.3rem] px-[0.7rem] rounded-[var(--radius-pill)] bg-[color-mix(in_srgb,var(--layer-1)_70%,transparent)] border border-edge">
            <LegendDot color="#22c55e" label="Modificado" />
            <LegendDot color="#ef4444" label="Sin resolver" />
            <LegendDot label="Sin cambios" faded />
          </div>
        ) : (
          <div className="absolute left-1/2 bottom-[0.7rem] -translate-x-1/2 font-mono text-[10px] text-ink-dim whitespace-nowrap py-[0.25rem] px-[0.6rem] rounded-[var(--radius-pill)] bg-[color-mix(in_srgb,var(--layer-1)_70%,transparent)] border border-edge">
            {selectedBlockId ? "Bloque seleccionado resaltado" : "Click en un bloque para inspeccionar"}
          </div>
        )}
      </div>

      {/* layer slider */}
      <AxisSlider axis="Y" value={layerY} max={maxLayerY} onChange={setLayerY} />

      {/* inspector */}
      <div className="shrink-0 border-t border-edge py-[0.7rem] px-[0.85rem] min-h-[64px]">
        <Inspector />
      </div>
    </div>
  );
}
