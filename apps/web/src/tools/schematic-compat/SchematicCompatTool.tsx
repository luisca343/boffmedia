"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon, Stepper } from "@boffmedia/ui";
import { WorkbenchLayout } from "@/components/boffmedia/ui/schematic/WorkbenchLayout";
import { useCompatEngine } from "./_hooks/useCompatEngine";
import { useToolActions } from "./_hooks/useToolActions";
import { useSchematicRender } from "./_hooks/useSchematicRender";
import { SchematicAssetProvider } from "@/lib/schematic/render";
import { selectEnv, useToolStore } from "./_store/tool.store";
import { SetupPanel } from "./_components/setup/SetupPanel";
import { DiffPanel } from "./_components/diff/DiffPanel";
import { PreviewPanel } from "./_components/preview/PreviewPanel";
import { ExportBar } from "./_components/export/ExportBar";

export function SchematicCompatTool() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const STEPS = [t("setup.environments"), t("setup.schematicSection"), t("setup.analyze"), t("setup.export")];
  const { api, status } = useCompatEngine();
  const actions = useToolActions(api);
  useSchematicRender(api);

  const engineReady = status === "ready" && api !== null;

  const sourceReg = useToolStore(selectEnv("source")).registry;
  const targetReg = useToolStore(selectEnv("target")).registry;
  const schematic = useToolStore((s) => s.schematic);
  const diff = useToolStore((s) => s.diff);

  const step = !(sourceReg && targetReg) ? 0 : !schematic ? 1 : !diff ? 2 : 3;

  // Plain wrapper around the worker call — never hand the Comlink proxy to React
  // as a prop (its dev-mode render logger can't serialize the proxy).
  const getBlockTexture = useCallback(
    (registryId: string, blockId: string, meta?: number): Promise<string | null> =>
      api ? api.getBlockTexture(registryId, blockId, meta) : Promise.resolve(null),
    [api],
  );

  const getBlockModel = useCallback(
    (registryId: string, blockId: string, stateLabel?: string, rotation?: number) =>
      api ? api.getBlockModel(registryId, blockId, stateLabel, rotation) : Promise.resolve(null),
    [api],
  );

  const getModdedBlockModel = useCallback(
    (registryId: string, blockId: string, states: Record<string, string>) =>
      api ? api.getModdedBlockModel(registryId, blockId, states) : Promise.resolve(null),
    [api],
  );

  const getBlockConnections = useCallback(
    (registryId: string, blockId: string) =>
      api ? api.getBlockConnections(registryId, blockId) : Promise.resolve(null),
    [api],
  );

  return (
    <SchematicAssetProvider
      getBlockTexture={getBlockTexture}
      getBlockModel={getBlockModel}
      getModdedBlockModel={getModdedBlockModel}
      getBlockConnections={getBlockConnections}
    >
      <div data-ds="boffmedia" className="flex min-h-0 flex-col overflow-hidden bg-base text-txt" style={{ height: "calc(100vh - var(--nav-h, 66px))" }}>
        {/* app bar */}
        <div className="shrink-0 flex items-center gap-[18px] px-[18px] h-[58px] bg-base-deep border-b-2 border-line">
          <div className="flex items-center gap-[11px] min-w-0">
            <span className="cut-tag [--cut-tag:9px] grid place-items-center w-[34px] h-[34px] shrink-0 bg-accent text-accent-ink">
              <Icon name="cube" size={18} />
            </span>
            <span className="flex flex-col leading-none min-w-0">
              <span className="font-display font-extrabold italic text-[20px] tracking-[0.01em] text-white whitespace-nowrap">
                {t("appName")}
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-txt-dim mt-1">{t("appTagline")}</span>
            </span>
          </div>
          <div className="flex-1 min-w-2" />
          <Stepper steps={STEPS} current={step} />
          <div className="flex-1 min-w-2" />
        </div>

        {/* body: three columns above 1180px, tabs at/below it (E-front) */}
        <WorkbenchLayout
          breakpoint={1180}
          panes={[
            {
              key: "setup",
              label: t("workbench.setupTab"),
              className:
                "w-[336px] shrink-0 border-r border-line overflow-y-auto overflow-x-hidden bg-base-2 max-[1180px]:w-[320px]",
              tabClassName: "overflow-y-auto overflow-x-hidden bg-base-2",
              node: (
                <SetupPanel
                  engineReady={engineReady}
                  onScanSource={actions.scanSourceInstance}
                  onScanTarget={actions.scanTargetInstance}
                  onChangeSourceGame={actions.changeSourceGame}
                  onChangeTargetGame={actions.changeTargetGame}
                  onLoadVanilla={actions.loadVanillaEnv}
                  onRetryPendingScan={actions.retryPendingScan}
                  onCancelPendingScan={actions.cancelPendingScan}
                  onPickSchematic={actions.loadSchematic}
                  onPickWorld={actions.attachWorldIds}
                  onDetachWorld={actions.clearWorldIds}
                  onAnalyze={actions.analyze}
                />
              ),
            },
            {
              key: "diff",
              label: t("workbench.diffTab"),
              className: "flex-1 min-w-[360px] flex flex-col border-r border-line bg-base",
              tabClassName: "flex flex-col bg-base",
              node: <DiffPanel />,
            },
            {
              key: "preview",
              label: t("workbench.previewTab"),
              // The 3D preview takes a large, window-proportional share (was a fixed
              // 372px) so big schematics are actually legible; capped so it never
              // starves the diff list on ultrawide displays.
              className: "w-[42%] min-w-[420px] max-w-[900px] shrink-0 flex flex-col bg-base-2 max-[1180px]:min-w-[360px]",
              tabClassName: "flex flex-col bg-base-2",
              node: <PreviewPanel />,
            },
          ]}
        />

        {/* export footer */}
        <ExportBar
          onExport={actions.exportSchematic}
          onExportRuleSet={actions.exportRuleSet}
          onImportRuleSet={actions.importRuleSet}
        />
      </div>
    </SchematicAssetProvider>
  );
}
