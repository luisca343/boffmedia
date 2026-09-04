"use client";

/**
 * The navigation guard: a tool asking to be CONSULTED before the host takes the
 * user somewhere that would destroy what they are in the middle of.
 *
 * The guard does not decide, and it does not render — it receives the departure
 * and a `proceed` continuation, and answers whenever it likes. That seam is why
 * the question is asked in the tool's own voice and the tool's own locale, with
 * the tool's own dialog: a battle knows it is a battle, and the shell around it
 * does not. A host that never asks (the launcher renders no links) simply never
 * calls in, and a tool that registers nothing costs a mounted guard check per
 * click and nothing else.
 *
 * WHAT COUNTS AS A DEPARTURE IS THE HOST'S CALL, not this module's. On the web
 * the tool stays mounted across its own routes (battlesim's rooms survive a trip
 * to the hub — see `battlesim/layout.tsx`), so only a link that leaves the tool
 * behind is worth a question; asking on every in-tool link would train the user
 * to dismiss the dialog before reading it, which is worse than not asking.
 *
 * LIFO: the most recently registered guard is the one on screen, so it is the
 * one asked. Guards are not stacked into a chain of dialogs.
 */

import { useEffect, useRef } from "react";

/** Where a click was going, for a guard that wants to say so in its dialog. */
export interface ToolNavIntent {
  /** The absolute URL of the destination. */
  href: string;
  /** True when it leaves the host's origin. */
  external: boolean;
}

/**
 * Called instead of navigating. Take as long as you like — show a dialog, ask —
 * then either call `proceed()` to let the navigation happen after all, or drop
 * it on the floor to stay put. Calling `proceed` twice navigates once.
 */
export type ToolNavGuardFn = (intent: ToolNavIntent, proceed: () => void) => void;

const guards: ToolNavGuardFn[] = [];

/** Register a guard until the returned function is called. */
export function registerToolNavGuard(guard: ToolNavGuardFn): () => void {
  guards.push(guard);
  return () => {
    const at = guards.lastIndexOf(guard);
    if (at !== -1) guards.splice(at, 1);
  };
}

/** Whether anything would be asked. Hosts check this before doing any work. */
export function hasToolNavGuard(): boolean {
  return guards.length > 0;
}

/**
 * HOST SIDE — hand a departure to the innermost guard.
 *
 * Returns `true` when a guard took it, which means the host must NOT navigate:
 * the guard owns the decision now and will call `proceed` if the answer is yes.
 * `false` means nobody is guarding and the host should carry on as normal.
 */
export function runToolNavGuards(intent: ToolNavIntent, proceed: () => void): boolean {
  const guard = guards[guards.length - 1];
  if (!guard) return false;
  let done = false;
  guard(intent, () => {
    if (done) return;
    done = true;
    proceed();
  });
  return true;
}

/**
 * TOOL SIDE — guard departures while `guard` is non-null.
 *
 * The callback is read through a ref, so passing a fresh arrow per render (the
 * normal thing to write) does not churn the registration; only the null/non-null
 * flip does. That matters because the guard is registered for as long as the
 * user is inside something losable, which is measured in minutes.
 */
export function useToolNavGuard(guard: ToolNavGuardFn | null): void {
  const latest = useRef(guard);
  useEffect(() => {
    latest.current = guard;
  });

  const active = guard != null;
  useEffect(() => {
    if (!active) return;
    return registerToolNavGuard((intent, proceed) => latest.current?.(intent, proceed));
  }, [active]);
}
