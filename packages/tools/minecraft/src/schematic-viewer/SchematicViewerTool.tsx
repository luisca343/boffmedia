"use client";

import { useCallback } from "react";
import { useToolT } from "../i18n";
import { Icon, Stepper } from "@boffmedia/ui";
import { WorkbenchLayout } from "../ui/WorkbenchLayout";
import { SchematicAssetProvider } from "../engine/render";
import { useViewerEngine } from "./_hooks/useViewerEngine";
import { useViewerActions } from "./_hooks/useViewerActions";
import { selectEnvironment, useViewerStore } from "./_store/viewer.store";
import { SetupSidebar } from "./_components/SetupSidebar";
import { ViewerPreview } from "./_components/ViewerPreview";

export function SchematicViewerTool() {
  const t = useToolT("tools.schematicViewer");
  const { api, status } = useViewerEngine();
  const engineReady = status === "ready" && api !== null;
  const { loadSchematic, attachWorldIds, clearWorldIds, changeVersion, changeMode, scanEnvironment } =
    useViewerActions(api, engineReady);

  const registry = useViewerStore(selectEnvironment).registry;
  const schematic = useViewerStore((s) => s.schematic);

  const step = !registry ? 0 : !schematic ? 1 : 2;
  const steps = [t("setup.environment"), t("setup.schematic"), t("setup.view")];

  // Plain wrappers around the worker calls — never hand the Comlink proxy to
  // React as a prop (its dev-mode render logger can't serialize the proxy).
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

  return (
    <SchematicAssetProvider
      getBlockTexture={getBlockTexture}
      getBlockModel={getBlockModel}
      getModdedBlockModel={getModdedBlockModel}
      // Connection shapes only matter when a block is re-targeted by a
      // conversion; this tool never re-targets anything.
      getBlockConnections={null}
    >
      {/* Fills whatever box the HOST gives it. This used to be
          `calc(100dvh - var(--nav-h))`, which is host coupling in disguise:
          `--nav-h` is defined in apps/web's globals.css only, so in the
          launcher the whole declaration was invalid and dropped, collapsing
          the shell to content height. Hosts size this now — web keeps the nav
          math in its route wrapper, the launcher gives it a flex box. */}
      <div
        data-ds="boffmedia"
        className="flex h-full min-h-0 flex-col overflow-hidden bg-base text-txt"
      >
        <div className="flex h-[58px] shrink-0 items-center gap-[18px] border-b-2 border-line bg-base-deep px-[18px]">
          <div className="flex min-w-0 items-center gap-[11px]">
            <span className="cut-tag [--cut-tag:9px] grid h-[34px] w-[34px] shrink-0 place-items-center bg-accent text-accent-ink">
              <Icon name="cube" size={18} />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="whitespace-nowrap font-display text-[20px] font-extrabold italic tracking-[0.01em] text-white">
                {t("appName")}
              </span>
              <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-txt-dim">
                {t("appTagline")}
              </span>
            </span>
          </div>
          <div className="min-w-2 flex-1" />
          <Stepper steps={steps} current={step} />
          <div className="min-w-2 flex-1" />
        </div>

        {/* body: two columns above 820px, tabs at/below it (E-front) — this
            tool's columns stop fitting earlier than compat's, hence the
            lower tool-specific breakpoint. */}
        <WorkbenchLayout
          breakpoint={820}
          panes={[
            {
              key: "setup",
              label: t("workbench.setupTab"),
              className:
                "w-[336px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-line bg-base-2 max-[1180px]:w-[300px]",
              tabClassName: "overflow-y-auto overflow-x-hidden bg-base-2",
              node: (
                <SetupSidebar
                  engineReady={engineReady}
                  onPickSchematic={loadSchematic}
                  onChangeVersion={changeVersion}
                  onPickWorld={attachWorldIds}
                  onDetachWorld={clearWorldIds}
                  onChangeMode={changeMode}
                  onScanInstance={scanEnvironment}
                />
              ),
            },
            {
              key: "preview",
              label: t("workbench.previewTab"),
              className: "flex min-w-[360px] flex-1 flex-col bg-base",
              tabClassName: "flex flex-col bg-base",
              node: <ViewerPreview />,
            },
          ]}
        />
      </div>
    </SchematicAssetProvider>
  );
}
