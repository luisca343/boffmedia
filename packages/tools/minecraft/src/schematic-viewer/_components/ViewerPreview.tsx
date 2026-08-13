"use client";

import { Suspense, lazy } from "react";
import { useToolT } from "../../i18n";
import {
  PreviewEmptyStage,
  PreviewShell,
  SourceAnchorInfo,
} from "../../ui";
import { useViewerShortcuts } from "../../engine/actions";
import { sourceAnchor } from "../../engine/render/originMath";
import { useViewerStore } from "../_store/viewer.store";
import { BlockInspector } from "./BlockInspector";

function Loading3D() {
  const t = useToolT("tools.schematicViewer");
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

/** The stage: shared chrome around the shared renderer, with no extra slots. */
export function ViewerPreview() {
  const t = useToolT("tools.schematicViewer");
  const schematic = useViewerStore((s) => s.schematic);
  const layerY = useViewerStore((s) => s.layerY);
  const navMode = useViewerStore((s) => s.navMode);
  const setLayerY = useViewerStore((s) => s.setLayerY);
  const setNavMode = useViewerStore((s) => s.setNavMode);
  const showAnchor = useViewerStore((s) => s.showAnchor);
  const setShowAnchor = useViewerStore((s) => s.setShowAnchor);

  useViewerShortcuts(useViewerStore);

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
          <BlockInspector />
        </div>
      }
    />
  );
}
