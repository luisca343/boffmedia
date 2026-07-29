"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  SchematicView,
  useConnectionsLoader,
  useModelLoader,
  useTextureLoader,
} from "@/lib/schematic/render";
import { selectEnv, useToolStore } from "../../_store/tool.store";
import { useCompatRender } from "./useCompatRender";

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-txt-dim">{children}</div>
  );
}

/**
 * Binds the tool's store to the shared, store-free renderer and injects the
 * conversion-only rendering concerns (diff plans, cross-game state bridging).
 */
export function SchematicViewer3D() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const schematic = useToolStore((s) => s.schematic);
  const isFetchingPositions = useToolStore((s) => s.isFetchingPositions);
  // Gates on the unfiltered set: "only changes" legitimately filters everything
  // out, and that must render an empty scene, not an empty state.
  const hasPositions = useToolStore((s) => s.blockPositions.length > 0);
  const littleTileGroups = useToolStore((s) => s.littleTileGroups);
  const littleTileStructures = useToolStore((s) => s.littleTileStructures);
  const selectedStructureIdx = useToolStore((s) => s.selectedStructureIdx);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const layerY = useToolStore((s) => s.layerY);
  const navMode = useToolStore((s) => s.navMode);
  const setNavMode = useToolStore((s) => s.setNavMode);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);
  // Schematic blocks come from the source instance — resolve their textures
  // against the source registry's version (vanilla CDN) and id (mod JARs).
  // In "converted" mode, changed blocks instead resolve against the target
  // registry (the block they're being converted to).
  const sourceEnv = useToolStore(selectEnv("source"));
  const targetEnv = useToolStore(selectEnv("target"));
  const sourceReg = sourceEnv.registry;
  const targetReg = targetEnv.registry;

  // Grabbed here, outside the R3F <Canvas>: the Canvas runs its own reconciler,
  // so React context from this tree does not reach components rendered inside it.
  // We capture the loaders as values and pass them down as props instead.
  const textureLoader = useTextureLoader();
  const modelLoader = useModelLoader();
  const connectionsLoader = useConnectionsLoader();

  const { groups, overrides } = useCompatRender(targetReg?.gameId, connectionsLoader);

  const loaders = useMemo(
    () => ({ texture: textureLoader, model: modelLoader }),
    [textureLoader, modelLoader],
  );
  const source = useMemo(
    () => ({ version: sourceReg?.version, registryId: sourceReg?.id }),
    [sourceReg?.version, sourceReg?.id],
  );
  const target = useMemo(
    () => ({ version: targetReg?.version, registryId: targetReg?.id }),
    [targetReg?.version, targetReg?.id],
  );
  const flyLabels = useMemo(
    () => ({ clickToStart: t("preview.flyClickToStart"), controlsHint: t("preview.flyControlsHint") }),
    [t],
  );
  const handleSelect = useCallback(
    (id: string | undefined) => setSelectedBlock(id),
    [setSelectedBlock],
  );

  // Concat the selected structures' geometry into the single pair of arrays the
  // store-free renderer expects. Small (a structure is tens of boxes), so
  // rebuilding on selection change is cheap.
  const structureHighlight = useMemo(() => {
    if (!selectedStructureIdx || selectedStructureIdx.length === 0) return null;
    const picked = selectedStructureIdx
      .map((i) => littleTileStructures[i])
      .filter((s) => s !== undefined);
    if (picked.length === 0) return null;
    let boxLen = 0;
    let cornerLen = 0;
    for (const s of picked) {
      boxLen += s.boxes.length;
      cornerLen += s.corners?.length ?? 0;
    }
    const boxes = new Float32Array(boxLen);
    const corners = cornerLen > 0 ? new Float32Array(cornerLen) : undefined;
    let bo = 0;
    let co = 0;
    for (const s of picked) {
      boxes.set(s.boxes, bo);
      bo += s.boxes.length;
      if (corners && s.corners) {
        corners.set(s.corners, co);
        co += s.corners.length;
      }
    }
    return { boxes, corners };
  }, [selectedStructureIdx, littleTileStructures]);

  if (!schematic) return <Empty>{t("preview.emptyNoSchematic")}</Empty>;
  if (isFetchingPositions) return <Empty>{t("preview.preparing")}</Empty>;
  if (!hasPositions && littleTileGroups.length === 0)
    return <Empty>{t("preview.noBlocks")}</Empty>;

  return (
    <SchematicView
      groups={groups}
      littleTiles={littleTileGroups}
      structureHighlight={structureHighlight}
      dimensions={schematic.dimensions}
      layerY={layerY}
      selectedBlockId={selectedBlockId}
      navMode={navMode}
      onNavModeChange={setNavMode}
      onSelect={handleSelect}
      source={source}
      target={target}
      loaders={loaders}
      flyLabels={flyLabels}
      {...overrides}
    />
  );
}
