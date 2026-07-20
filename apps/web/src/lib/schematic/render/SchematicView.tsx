"use client";

import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { NavMode } from "../state/types";
import { FlyHud, useFlyHud, type FlyHudLabels } from "./fly-hud";
import { SchematicScene, type SchematicSceneProps } from "./scene";

export type SchematicViewProps = Omit<
  SchematicSceneProps,
  "lockSelector" | "hud" | "onLockChange" | "navMode"
> & {
  navMode: NavMode;
  /** Fly mode releases back to orbit whenever the pointer lock is lost. */
  onNavModeChange: (m: NavMode) => void;
  flyLabels: FlyHudLabels;
  /** Must be unique on the page — it doubles as the pointer-lock click target. */
  stageId?: string;
};

/**
 * The 3D view: a WebGL canvas over the scene graph, plus the fly-mode overlay.
 * Every input is a prop, so any tool can mount it — a conversion tool feeds it
 * diff-aware render overrides, a read-only viewer feeds it nothing.
 *
 * Uses WebGL, so mount it behind a no-SSR dynamic import.
 */
export function SchematicView({
  navMode,
  onNavModeChange,
  flyLabels,
  stageId = "sch3d-stage",
  ...scene
}: SchematicViewProps) {
  const hud = useFlyHud();
  const [flyLocked, setFlyLocked] = useState(false);

  const handleLockChange = useCallback(
    (locked: boolean) => {
      setFlyLocked(locked);
      // Esc (or any pointer-lock loss) drops back to orbit navigation.
      if (!locked) onNavModeChange("orbit");
    },
    [onNavModeChange],
  );

  return (
    <div id={stageId} className="relative h-full w-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0f172a" }}
        className="h-full w-full"
      >
        <SchematicScene
          {...scene}
          navMode={navMode}
          lockSelector={`#${stageId}`}
          hud={hud}
          onLockChange={handleLockChange}
        />
      </Canvas>
      {navMode === "fly" && <FlyHud hud={hud} locked={flyLocked} labels={flyLabels} />}
    </div>
  );
}
