"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useToolStore } from "../../_store/tool.store";
import { LayerSlider } from "./LayerSlider";

// R3F uses WebGL — skip SSR entirely.
const SchematicViewer3D = dynamic(
  () => import("./SchematicViewer3D").then((m) => ({ default: m.SchematicViewer3D })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-ink-dim">
        Loading 3D engine…
      </div>
    ),
  },
);

function Inspector() {
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);

  if (!selectedBlockId) {
    return (
      <p className="px-3 py-2.5 text-[11px] text-ink-dim">
        Click a block in the 3D view to inspect it
      </p>
    );
  }

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const block = group?.block;
  const diffEntry = diff?.entries.find((e) => e.block.id === selectedBlockId);
  const stateEntries = block ? Object.entries(block.states) : [];

  return (
    <div className="space-y-2 px-3 py-2.5">
      <p className="truncate font-mono text-xs font-semibold text-ink">{selectedBlockId}</p>

      {stateEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {stateEntries.map(([k, v]) => (
            <div key={k} className="col-span-2 flex justify-between text-[11px]">
              <span className="text-ink-muted">{k}</span>
              <span className="font-mono text-ink-dim">{v}</span>
            </div>
          ))}
        </div>
      )}

      {diffEntry && (
        <p className="text-[11px] text-ink-dim">
          {diffEntry.instanceCount.toLocaleString()} instance
          {diffEntry.instanceCount !== 1 ? "s" : ""}
          {" · "}
          <span className="capitalize">{diffEntry.status.replace("-", " ")}</span>
        </p>
      )}
    </div>
  );
}

export function PreviewPanel() {
  const schematic = useToolStore((s) => s.schematic);
  const layerY = useToolStore((s) => s.layerY);
  const diffOnlyMode = useToolStore((s) => s.diffOnlyMode);
  const setLayerY = useToolStore((s) => s.setLayerY);
  const setDiffOnlyMode = useToolStore((s) => s.setDiffOnlyMode);

  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen so the toggle icon/label stays in sync, including when the
  // user exits via Esc or the browser chrome rather than the button.
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen?.();
    }
  }, []);

  const maxLayerY = schematic ? schematic.dimensions.y - 1 : 0;

  return (
    // bg-layer-1 so the panel has a solid backdrop when blown up to fill the
    // screen (the normal layout sits on the page background).
    <div ref={rootRef} className="flex h-full flex-col bg-layer-1">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-edge/40 px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Preview</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDiffOnlyMode(!diffOnlyMode)}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              diffOnlyMode
                ? "bg-accent/20 font-medium text-accent"
                : "text-ink-dim hover:text-ink-muted"
            }`}
          >
            Diff only
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            disabled={!schematic}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="rounded p-1 text-ink-dim transition-colors hover:text-ink-muted disabled:opacity-40"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Canvas area — flex-1 so it fills all remaining space */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SchematicViewer3D />
      </div>

      {/* Layer slider — only when a schematic is loaded */}
      {schematic && (
        <LayerSlider value={layerY} max={maxLayerY} onChange={setLayerY} />
      )}

      {/* Inspector */}
      <div className="shrink-0 border-t border-edge/40">
        <Inspector />
      </div>
    </div>
  );
}
