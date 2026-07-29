"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SchematicView, useModelLoader, useTextureLoader } from "@/lib/schematic/render";
import { selectEnvironment, useViewerStore } from "../_store/viewer.store";

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-txt-dim">{children}</div>
  );
}

/**
 * Binds the store to the shared renderer. No {@link RenderOverrides} — a
 * read-only viewer draws the build exactly as the source file describes it, so
 * every diff-aware hook is left at its default.
 */
export function SchematicViewer3D() {
  const t = useTranslations("games.minecraft.schematicViewer");
  const schematic = useViewerStore((s) => s.schematic);
  const isFetchingPositions = useViewerStore((s) => s.isFetchingPositions);
  const groups = useViewerStore((s) => s.blockPositions);
  const littleTileGroups = useViewerStore((s) => s.littleTileGroups);
  const selectedBlockId = useViewerStore((s) => s.selectedBlockId);
  const layerY = useViewerStore((s) => s.layerY);
  const navMode = useViewerStore((s) => s.navMode);
  const setNavMode = useViewerStore((s) => s.setNavMode);
  const setSelectedBlock = useViewerStore((s) => s.setSelectedBlock);
  const registry = useViewerStore(selectEnvironment).registry;

  // Read outside the R3F <Canvas>: it runs its own reconciler, so context from
  // this tree does not reach components rendered inside it — pass values down.
  const textureLoader = useTextureLoader();
  const modelLoader = useModelLoader();

  const loaders = useMemo(
    () => ({ texture: textureLoader, model: modelLoader }),
    [textureLoader, modelLoader],
  );
  const source = useMemo(
    () => ({ version: registry?.version, registryId: registry?.id }),
    [registry?.version, registry?.id],
  );
  const flyLabels = useMemo(
    () => ({ clickToStart: t("preview.flyClickToStart"), controlsHint: t("preview.flyControlsHint") }),
    [t],
  );

  if (!schematic) return <Empty>{t("preview.emptyNoSchematic")}</Empty>;
  if (isFetchingPositions) return <Empty>{t("preview.preparing")}</Empty>;
  if (groups.length === 0 && littleTileGroups.length === 0)
    return <Empty>{t("preview.noBlocks")}</Empty>;

  return (
    <SchematicView
      groups={groups}
      littleTiles={littleTileGroups}
      dimensions={schematic.dimensions}
      layerY={layerY}
      selectedBlockId={selectedBlockId}
      navMode={navMode}
      onNavModeChange={setNavMode}
      onSelect={setSelectedBlock}
      source={source}
      loaders={loaders}
      flyLabels={flyLabels}
      stageId="schview-stage"
    />
  );
}
