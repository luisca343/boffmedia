"use client";

import { useCallback } from "react";
import { SchIcon, Stepper } from "@/components/boffmedia/ui/schematic";
import { useCompatEngine } from "./_hooks/useCompatEngine";
import { useToolActions } from "./_hooks/useToolActions";
import { useSchematicRender } from "./_hooks/useSchematicRender";
import { ModTextureProvider } from "./_hooks/modTextureContext";
import { useToolStore } from "./_store/tool.store";
import { SetupPanel } from "./_components/setup/SetupPanel";
import { DiffPanel } from "./_components/diff/DiffPanel";
import { PreviewPanel } from "./_components/preview/PreviewPanel";
import { ExportBar } from "./_components/export/ExportBar";

const STEPS = ["Entornos", "Esquema", "Analizar", "Exportar"];

export function SchematicCompatTool() {
  const { api, status } = useCompatEngine();
  const actions = useToolActions(api);
  useSchematicRender(api);

  const engineReady = status === "ready" && api !== null;

  const sourceReg = useToolStore((s) => s.sourceReg);
  const targetReg = useToolStore((s) => s.targetReg);
  const schematic = useToolStore((s) => s.schematic);
  const diff = useToolStore((s) => s.diff);

  const step = !(sourceReg && targetReg) ? 0 : !schematic ? 1 : !diff ? 2 : 3;

  // Plain wrapper around the worker call — never hand the Comlink proxy to React
  // as a prop (its dev-mode render logger can't serialize the proxy).
  const getBlockTexture = useCallback(
    (registryId: string, blockId: string): Promise<string | null> =>
      api ? api.getBlockTexture(registryId, blockId) : Promise.resolve(null),
    [api],
  );

  const getBlockModel = useCallback(
    (registryId: string, blockId: string, stateLabel?: string, rotation?: number) =>
      api ? api.getBlockModel(registryId, blockId, stateLabel, rotation) : Promise.resolve(null),
    [api],
  );

  const getBlockConnections = useCallback(
    (registryId: string, blockId: string) =>
      api ? api.getBlockConnections(registryId, blockId) : Promise.resolve(null),
    [api],
  );

  return (
    <ModTextureProvider
      getBlockTexture={getBlockTexture}
      getBlockModel={getBlockModel}
      getBlockConnections={getBlockConnections}
    >
      <div className="flex min-h-0 flex-col overflow-hidden bg-base" style={{ height: "calc(100vh - 64px)" }}>
        {/* app bar */}
        <div className="shrink-0 flex items-center gap-4 py-[0.6rem] px-4 border-b border-edge bg-[color-mix(in_srgb,var(--layer-1)_86%,transparent)] backdrop-blur-[8px]">
          <div className="flex items-center gap-[0.7rem] min-w-0">
            <span className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[var(--radius)] border border-edge-strong bg-[var(--accent-soft)] text-[color:var(--accent-bright)]">
              <SchIcon name="cube" size={18} />
            </span>
            <span className="flex flex-col leading-[1.1] min-w-0">
              <span className="font-display font-extrabold text-[0.95rem] tracking-[var(--display-spacing)] whitespace-nowrap">
                Schematic Compat
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-dim">Minecraft · Hytale</span>
            </span>
          </div>
          <div className="flex-1 min-w-[0.5rem]" />
          <Stepper steps={STEPS} current={step} />
          <div className="flex-1 min-w-[0.5rem]" />
        </div>

        {/* body: three columns */}
        <div className="flex-1 min-h-0 flex">
          <aside className="w-[312px] shrink-0 border-r border-edge overflow-y-auto overflow-x-hidden bg-[color-mix(in_srgb,var(--layer-1)_40%,transparent)] max-[1180px]:w-[288px]">
            <SetupPanel
              engineReady={engineReady}
              onScanSource={actions.scanSourceInstance}
              onScanTarget={actions.scanTargetInstance}
              onPickSchematic={actions.loadSchematic}
              onAnalyze={actions.analyze}
            />
          </aside>
          <main className="flex-1 min-w-0 flex flex-col border-r border-edge">
            <DiffPanel />
          </main>
          <aside className="w-[372px] shrink-0 flex flex-col bg-layer-1 max-[1180px]:w-[320px]">
            <PreviewPanel />
          </aside>
        </div>

        {/* export footer */}
        <ExportBar
          onExport={actions.exportSchematic}
          onExportRuleSet={actions.exportRuleSet}
          onImportRuleSet={actions.importRuleSet}
        />
      </div>
    </ModTextureProvider>
  );
}
