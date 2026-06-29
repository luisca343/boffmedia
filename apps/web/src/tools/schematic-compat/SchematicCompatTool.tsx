"use client";

import { useCallback } from "react";
import { useCompatEngine } from "./_hooks/useCompatEngine";
import { useToolActions } from "./_hooks/useToolActions";
import { useSchematicRender } from "./_hooks/useSchematicRender";
import { ModTextureProvider } from "./_hooks/modTextureContext";
import { ToolLayout } from "./_components/layout/ToolLayout";
import { SetupPanel } from "./_components/setup/SetupPanel";
import { DiffPanel } from "./_components/diff/DiffPanel";
import { PreviewPanel } from "./_components/preview/PreviewPanel";

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
  useSchematicRender(api);

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
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
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
          previewPanel={<PreviewPanel />}
          exportBar={<ExportPlaceholder />}
        />
      </div>
    </ModTextureProvider>
  );
}
