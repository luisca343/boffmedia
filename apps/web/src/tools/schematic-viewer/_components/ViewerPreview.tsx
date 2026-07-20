"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { PreviewEmptyStage, PreviewShell } from "@/components/boffmedia/ui/schematic";
import { useViewerShortcuts } from "@/lib/schematic/actions";
import { useViewerStore } from "../_store/viewer.store";
import { BlockInspector } from "./BlockInspector";

function Loading3D() {
  const t = useTranslations("games.minecraft.schematicViewer");
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

/** The stage: shared chrome around the shared renderer, with no extra slots. */
export function ViewerPreview() {
  const t = useTranslations("games.minecraft.schematicViewer");
  const schematic = useViewerStore((s) => s.schematic);
  const layerY = useViewerStore((s) => s.layerY);
  const navMode = useViewerStore((s) => s.navMode);
  const setLayerY = useViewerStore((s) => s.setLayerY);
  const setNavMode = useViewerStore((s) => s.setNavMode);

  useViewerShortcuts(useViewerStore);

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
        schematic ? <SchematicViewer3D /> : <PreviewEmptyStage caption={t("preview.emptyCaption")} />
      }
      inspector={<BlockInspector />}
    />
  );
}
