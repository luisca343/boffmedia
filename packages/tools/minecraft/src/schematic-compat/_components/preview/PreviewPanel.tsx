"use client";

import { Suspense, lazy } from "react";
import { useToolT } from "../../../i18n";
import {
  PreviewButton,
  PreviewEmptyStage,
  PreviewShell,
  SourceAnchorInfo,
} from "../../../ui";
import { sourceAnchor } from "../../../engine/render/originMath";
import { useToolStore } from "../../_store/tool.store";
import { Inspector } from "./Inspector";
import { StageCaption } from "./StageCaption";
import { ModeSwitch } from "./switches";
import { useViewerShortcuts } from "../../../engine/actions";

function Loading3D() {
  const t = useToolT("tools.schematicCompat");
  return (
    <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-txt-dim">
      {t("preview.loading3d")}
    </div>
  );
}

// R3F uses WebGL, so this must never render on a server. `React.lazy` never
// runs during SSR's synchronous render — the Suspense boundary below emits the
// fallback instead — which gives the same guarantee `next/dynamic({ssr:false})`
// did, without tying the package to Next.
const SchematicViewer3D = lazy(() =>
  import("./SchematicViewer3D").then((m) => ({ default: m.SchematicViewer3D })),
);

/** Wires the tool's store into the preview shell and its conversion-only slots. */
export function PreviewPanel() {
  const t = useToolT("tools.schematicCompat");
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
  const showAnchor = useToolStore((s) => s.showAnchor);
  const setShowAnchor = useToolStore((s) => s.setShowAnchor);

  useViewerShortcuts(useToolStore);

  const convertedView = previewMode === "converted" && !!diff;
  const resultView = previewMode === "result" && !!diff;
  const anchor = sourceAnchor(schematic?.origin, schematic?.offset);

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
      stage={
        schematic ? (
          <Suspense fallback={<Loading3D />}>
            <SchematicViewer3D />
          </Suspense>
        ) : (
          <PreviewEmptyStage caption={t("preview.emptyCaption")} />
        )
      }
      caption={
        <StageCaption
          convertedView={convertedView}
          resultView={resultView}
          hasSelection={!!selectedBlockId}
        />
      }
      inspector={
        <div className="grid gap-2">
          <SourceAnchorInfo
            labels={{
              title: t("preview.originTitle"),
              origin: t("preview.origin"),
              playerStand: t("preview.playerStand"),
              copyTp: t("preview.copyTp"),
              copied: t("preview.copied"),
              showMarker: t("preview.showMarker"),
            }}
            origin={anchor.origin}
            playerPos={anchor.playerPos}
            showMarker={showAnchor}
            onShowMarkerChange={setShowAnchor}
          />
          <Inspector />
        </div>
      }
    />
  );
}
