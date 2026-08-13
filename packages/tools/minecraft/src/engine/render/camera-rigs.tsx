"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import type { FlyHudRefs } from "./fly-hud";
import { ddaPick, type PickIndex } from "./picking";

// Frame-loop scratch vectors (module-level to avoid per-frame allocation).
const V_DIR = new THREE.Vector3();
const V_RIGHT = new THREE.Vector3();
const V_WISH = new THREE.Vector3();

/** Frames the whole build on first mount and whenever its dimensions change. */
export function CameraRig({ dimensions }: { dimensions: { x: number; y: number; z: number } }) {
  const { camera } = useThree();
  useEffect(() => {
    const { x: sx, y: sy, z: sz } = dimensions;
    const span = Math.max(sx, sy, sz);
    const dist = span * 2.2;
    camera.position.set(sx / 2 + dist * 0.55, sy / 2 + dist * 0.45, sz / 2 + dist * 0.85);
    if (camera instanceof THREE.PerspectiveCamera) {
      // Scale near with the schematic size: a fixed 0.1 near against a far plane
      // sized for a 500-block span crushes depth precision and z-fights the whole
      // surface. Keep near ≥ 0.1 for small builds.
      camera.near = Math.max(0.1, span * 0.02);
      camera.far = dist * 20;
      camera.updateProjectionMatrix();
    }
    // Only run on first mount / dimension change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.x, dimensions.y, dimensions.z]);
  return null;
}

export interface FlyRigProps {
  span: number;
  pickIndex: PickIndex | null;
  lockSelector: string;
  hud: FlyHudRefs;
  /** Read inside the frame loop — the active Y-slice bounds the crosshair walk. */
  layerYRef: React.RefObject<number>;
  onPick: (blockId: string | null) => void;
  onLockChange: (locked: boolean) => void;
}

/**
 * Minecraft-spectator navigation: pointer-lock mouse look, WASD along the view
 * direction (forward follows pitch, like spectator), Space/Shift for world
 * up/down, scroll to scale flight speed, and exponential velocity smoothing for
 * the drifty spectator feel. Esc releases the pointer and the parent drops back
 * to orbit. While locked, a click selects the block under the crosshair via the
 * voxel walk.
 */
export function FlyRig({ span, pickIndex, lockSelector, hud, layerYRef, onPick, onLockChange }: FlyRigProps) {
  const { camera, gl } = useThree();
  const lockedRef = useRef(false);
  const keys = useRef({ f: false, b: false, l: false, r: false, up: false, down: false });
  const vel = useRef(new THREE.Vector3());
  const speedMul = useRef(1);
  const hudClock = useRef(0);
  const baseSpeed = Math.max(8, span / 5);

  // Fly-range clipping: orbit scales `near` with the schematic (depth precision
  // at orbit distance), which would clip walls you hover next to. Restore the
  // orbit planes on exit.
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const prevNear = camera.near;
    const prevFar = camera.far;
    camera.near = 0.1;
    camera.far = Math.max(200, span * 6);
    camera.updateProjectionMatrix();
    return () => {
      camera.near = prevNear;
      camera.far = prevFar;
      camera.updateProjectionMatrix();
    };
  }, [camera, span]);

  // Movement keys — Minecraft defaults, by physical key (layout-independent).
  useEffect(() => {
    const apply = (code: string, v: boolean): boolean => {
      const k = keys.current;
      switch (code) {
        case "KeyW": k.f = v; return true;
        case "KeyS": k.b = v; return true;
        case "KeyA": k.l = v; return true;
        case "KeyD": k.r = v; return true;
        case "Space": k.up = v; return true;
        case "ShiftLeft":
        case "ShiftRight": k.down = v; return true;
        default: return false;
      }
    };
    const down = (e: KeyboardEvent) => {
      if (lockedRef.current && apply(e.code, true)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      apply(e.code, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Scroll scales flight speed (spectator's scroll-to-change-speed).
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!lockedRef.current) return;
      e.preventDefault();
      speedMul.current = Math.min(10, Math.max(0.25, speedMul.current * Math.pow(1.15, -e.deltaY / 100)));
      if (hud.speed.current) hud.speed.current.textContent = `×${speedMul.current.toFixed(2)}`;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, hud]);

  // Crosshair click-to-select while locked.
  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => {
      if (!lockedRef.current || !pickIndex) return;
      camera.getWorldDirection(V_DIR);
      onPick(ddaPick(camera.position, V_DIR, pickIndex, layerYRef.current, span * 4));
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [gl, camera, pickIndex, onPick, span, layerYRef]);

  // Release the pointer when fly mode unmounts — drei disconnects its listeners
  // but does not exit an active lock.
  useEffect(() => {
    const el = gl.domElement;
    return () => {
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1); // no teleporting after a tab switch
    const k = keys.current;
    camera.getWorldDirection(V_DIR);
    // Strafe stays horizontal (Minecraft-style): camera right, flattened.
    V_RIGHT.setFromMatrixColumn(camera.matrixWorld, 0);
    V_RIGHT.y = 0;
    if (V_RIGHT.lengthSq() > 1e-6) V_RIGHT.normalize();
    V_WISH.set(0, 0, 0);
    if (lockedRef.current) {
      if (k.f) V_WISH.add(V_DIR);
      if (k.b) V_WISH.sub(V_DIR);
      if (k.r) V_WISH.add(V_RIGHT);
      if (k.l) V_WISH.sub(V_RIGHT);
      if (k.up) V_WISH.y += 1;
      if (k.down) V_WISH.y -= 1;
      if (V_WISH.lengthSq() > 0) V_WISH.normalize().multiplyScalar(baseSpeed * speedMul.current);
    }
    vel.current.lerp(V_WISH, 1 - Math.exp(-10 * delta));
    if (vel.current.lengthSq() > 1e-7) camera.position.addScaledVector(vel.current, delta);

    hudClock.current += delta;
    if (hudClock.current >= 0.12) {
      hudClock.current = 0;
      const p = camera.position;
      if (hud.pos.current) {
        hud.pos.current.textContent = `${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}`;
      }
      if (hud.look.current) {
        const id = pickIndex ? ddaPick(p, V_DIR, pickIndex, layerYRef.current, span * 4) : null;
        hud.look.current.textContent = id ?? "—";
      }
    }
  });

  return (
    <PointerLockControls
      makeDefault
      selector={lockSelector}
      onLock={() => {
        lockedRef.current = true;
        onLockChange(true);
      }}
      onUnlock={() => {
        lockedRef.current = false;
        keys.current = { f: false, b: false, l: false, r: false, up: false, down: false };
        vel.current.set(0, 0, 0);
        onLockChange(false);
      }}
    />
  );
}
