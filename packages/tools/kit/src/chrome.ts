"use client";

/**
 * The chrome lock: a tool telling its HOST to hold its navigation still.
 *
 * The web shell's tool rail is minimised to icons and opens on hover, which is
 * right for a tool you read and wrong for one you PLAY. A battle puts the
 * things you click — the dock, the field's left half — within a few pixels of
 * the window's left edge, so overshooting a target slides a 264px rail out over
 * the board mid-turn. Nothing was clicked and nothing is wrong, which is
 * exactly why it cannot be fixed by aiming better.
 *
 * It is a LOCK rather than a manifest flag because "playing" is a state, not a
 * route: battlesim's lobby, teambuilder and battle all live under one mounted
 * tool (see `battlesim/layout.tsx`), and only the last of them wants the rail
 * frozen. It counts rather than toggles so two locked surfaces overlapping —
 * a battle and a replay opened over it — cannot have the first one to unmount
 * unlock the chrome for the one still on screen.
 *
 * What a host does with it is the host's business; the contract is only "the
 * user is inside something immersive". apps/web drops the rail's hover-open
 * (keyboard focus still opens it, and an explicit pin still pins it — the lock
 * is about the mouse arriving by accident, not about the user asking).
 */

import { useEffect, useSyncExternalStore } from "react";

let locks = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Hold the host's chrome still until the returned function is called.
 * Releasing twice is a no-op — a released lock cannot decrement the count a
 * second time and strand the chrome frozen.
 */
export function lockToolChrome(): () => void {
  locks += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    emit();
  };
}

/** Whether any tool currently holds the chrome. For non-React hosts. */
export function isToolChromeLocked(): boolean {
  return locks > 0;
}

/** Subscribe to lock/unlock. For non-React hosts. */
export function subscribeToolChrome(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * TOOL SIDE — hold the chrome for as long as this component is mounted.
 *
 * `active` exists so a component that is immersive only sometimes does not have
 * to be split in two to say so; the lock is taken and released as it flips.
 */
export function useToolChromeLock(active = true): void {
  useEffect(() => {
    if (!active) return;
    return lockToolChrome();
  }, [active]);
}

/**
 * HOST SIDE — whether a tool is asking for the chrome to stay still,
 * re-rendering when that changes.
 *
 * Server render: `false`. The lock is only ever taken by a mounted client tool,
 * so the static HTML of a shell is never the locked one.
 */
export function useToolChromeLocked(): boolean {
  return useSyncExternalStore(subscribeToolChrome, isToolChromeLocked, serverSnapshot);
}

function serverSnapshot(): boolean {
  return false;
}
