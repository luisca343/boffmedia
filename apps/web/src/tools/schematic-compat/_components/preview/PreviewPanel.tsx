"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { PreviewButton, PreviewEmptyStage, PreviewShell } from "@/components/boffmedia/ui/schematic";
import { useToolStore } from "../../_store/tool.store";
import { Inspector } from "./Inspector";
import { StageCaption } from "./StageCaption";
import { ModeSwitch } from "./switches";
import { useViewerShortcuts } from "@/lib/schematic/actions";

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
  { ssr: false, loading: () => <Loading3D /> },
);

/** Wires the tool's store into the preview shell and its conversion-only slots. */
export function PreviewPanel() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const schematic = useToolStore((s) => s.schematic);
  const layerY = useToolStore((s) => s.layerY);
  const hideUnchanged = useToolStore((s) => s.hideUnchanged);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const previewMode = useToolStore((s) => s.previewMode);
  const diff = useToolStore((s) => s.diff);
  const navMode = useToolStore((s) => s.navMode);
  const setLayerY = useToolStore((s) => s.setLayerY);
  const setHideUnchanged = useToolStore((s) => s.setHideUnchanged);
  const setPreviewMode = useToolStore((s) => s.setPreviewMode);
  const setNavMode = useToolStore((s) => s.setNavMode);

  useViewerShortcuts(useToolStore);

  const convertedView = previewMode === "converted" && !!diff;
  const resultView = previewMode === "result" && !!diff;

  return (
    <PreviewShell
      labels={{
        title: t("preview.title"),
        fullscreen: t("preview.fullscreen"),
        exitFullscreen: t("preview.exitFullscreen"),
        navOrbit: t("preview.navOrbit"),
        navFly: t("preview.navFly"),
        navOrbitHint: t("preview.navOrbitHint"),
        navFlyHint: t("preview.navFlyHint"),
      }}
      headerLead={<ModeSwitch mode={previewMode} convertedEnabled={!!diff} onChange={setPreviewMode} />}
      headerTrail={
        resultView && (
          <PreviewButton
            on={hideUnchanged}
            onClick={() => setHideUnchanged(!hideUnchanged)}
            title={t("preview.onlyChangesHint")}
          >
            {t("preview.onlyChanges")}
          </PreviewButton>
        )
      }
      navMode={navMode}
      onNavModeChange={setNavMode}
      layerY={layerY}
      maxLayerY={schematic ? schematic.dimensions.y - 1 : 0}
      onLayerYChange={setLayerY}
      hasDocument={!!schematic}
      stage={schematic ? <SchematicViewer3D /> : <PreviewEmptyStage caption={t("preview.emptyCaption")} />}
      caption={
        <StageCaption
          convertedView={convertedView}
          resultView={resultView}
          hasSelection={!!selectedBlockId}
        />
      }
      inspector={<Inspector />}
    />
  );
}
