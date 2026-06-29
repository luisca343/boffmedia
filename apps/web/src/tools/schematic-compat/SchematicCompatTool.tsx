"use client";

import { useCallback } from "react";
import { useCompatEngine } from "./_hooks/useCompatEngine";
import { useToolActions } from "./_hooks/useToolActions";
import { ModTextureProvider } from "./_hooks/modTextureContext";
import { ToolLayout } from "./_components/layout/ToolLayout";
import { SetupPanel } from "./_components/setup/SetupPanel";
import { DiffPanel } from "./_components/diff/DiffPanel";

function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-edge/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Preview
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-ink-dim">
        <div className="text-center">
          3D Viewer
          <br />
          <span className="text-xs">(Phase 3)</span>
        </div>
      </div>
    </div>
  );
}

function ExportPlaceholder() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm text-ink-dim">
      <span className="font-medium text-ink-muted">Export</span>
      <span className="text-xs">(Phase 4)</span>
    </div>
  );
}

export function SchematicCompatTool() {
  const { api, status } = useCompatEngine();
  const actions = useToolActions(api);

  const engineReady = status === "ready" && api !== null;

  // Plain wrapper around the worker call — never hand the Comlink proxy to React
  // as a prop (its dev-mode render logger can't serialize the proxy).
  const getBlockTexture = useCallback(
    (registryId: string, blockId: string): Promise<string | null> =>
      api ? api.getBlockTexture(registryId, blockId) : Promise.resolve(null),
    [api],
  );

  return (
    <ModTextureProvider getBlockTexture={getBlockTexture}>
      <div className="flex h-full min-h-0 flex-col">
        <ToolLayout
          setupPanel={
            <SetupPanel
              engineReady={engineReady}
              onScanSource={actions.scanSourceInstance}
              onScanTarget={actions.scanTargetInstance}
              onPickSchematic={actions.loadSchematic}
              onAnalyze={actions.analyze}
            />
          }
          diffPanel={<DiffPanel />}
          previewPanel={<PreviewPlaceholder />}
          exportBar={<ExportPlaceholder />}
        />
      </div>
    </ModTextureProvider>
  );
}
