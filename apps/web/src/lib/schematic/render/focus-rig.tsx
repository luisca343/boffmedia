"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Resolved fly-to goal for {@link FocusRig}: a world-space eye position, a
 * look-at target (used in orbit mode only — PointerLockControls has no
 * target) and a nonce. The nonce is the retrigger key rather than the
 * position, so re-requesting the exact same placement (RF-03 wrap-around
 * first↔last) still re-plays the animation.
 */
export interface FocusGoal {
  position: [number, number, number];
  target: [number, number, number];
  nonce: number;
}

export interface FocusRigProps {
  focus: FocusGoal | null;
}

const DURATION = 0.4; // ~400ms

function easeOutCubic(t: number): number {
  const p = t - 1;
  return p * p * p + 1;
}

// Movement keys FlyRig reacts to — any of them during the animation means the
// user has started flying, so the rig must yield immediately.
const FLY_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight"]);

interface AnimState {
  nonce: number;
  t: number;
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPos: THREE.Vector3;
  toTarget: THREE.Vector3;
  active: boolean;
}

/** Duck-typed OrbitControls handle — the only shape this rig needs from it. */
interface ControlsLike {
  target: THREE.Vector3;
  update?: () => void;
}

function hasTarget(controls: unknown): controls is ControlsLike {
  return !!controls && typeof controls === "object" && "target" in controls;
}

/**
 * Animates the camera to a requested placement over ~400ms of eased
 * interpolation. Subscribes `useFrame` at the default priority 0 — a positive
 * priority would flip R3F into manual-render mode and blank the canvas — and
 * must be MOUNTED AFTER FlyRig so its equal-priority callback runs later in
 * subscription order, winning the camera write for the duration of the
 * animation and yielding it back completely once it settles.
 * Inert whenever `focus` is null. Any fly-mode key or a locked-pointer look
 * cancels the animation immediately, so the rig never steals control from a
 * user who starts moving. Store-free, props-only — no import from `tools/`.
 */
export function FocusRig({ focus }: FocusRigProps) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const stateRef = useRef<AnimState | null>(null);

  useEffect(() => {
    if (!focus) {
      if (stateRef.current) stateRef.current.active = false;
      return;
    }
    if (stateRef.current?.nonce === focus.nonce) return;
    const target = hasTarget(controls) ? controls.target.clone() : new THREE.Vector3(...focus.target);
    stateRef.current = {
      nonce: focus.nonce,
      t: 0,
      fromPos: camera.position.clone(),
      fromTarget: target,
      toPos: new THREE.Vector3(...focus.position),
      toTarget: new THREE.Vector3(...focus.target),
      active: true,
    };
  }, [focus, camera, controls]);

  // Fly-mode WASD/Space/Shift cancels the animation outright.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (FLY_KEYS.has(e.code) && stateRef.current) stateRef.current.active = false;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A locked-pointer look (fly mode's mouse-look) also cancels it; harmless in
  // orbit mode since the pointer is never locked there.
  useEffect(() => {
    const onMove = () => {
      if (document.pointerLockElement && stateRef.current) stateRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, rawDelta) => {
    const s = stateRef.current;
    if (!s || !s.active) return;
    const delta = Math.min(rawDelta, 0.1);
    s.t = Math.min(1, s.t + delta / DURATION);
    const e = easeOutCubic(s.t);
    camera.position.lerpVectors(s.fromPos, s.toPos, e);
    if (hasTarget(controls)) {
      controls.target.lerpVectors(s.fromTarget, s.toTarget, e);
      controls.update?.();
    }
    if (s.t >= 1) s.active = false;
  });

  return null;
}
