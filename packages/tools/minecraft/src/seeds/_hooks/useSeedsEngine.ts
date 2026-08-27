/**
 * useSeedsEngine — boots the worker pool plus the main-thread evaluator, and
 * tears both down on unmount.
 *
 * One set per mounted tool, keyed on the pack stack. That is not tidiness:
 * deepslate's registries are module-global, so an isolate that has loaded a
 * stack can never cleanly load a different one. Changing stacks is therefore
 * modelled as remounting, which `stackKey` does.
 *
 * The `LocalWorld` alongside is a fifth evaluator on the main thread, and it
 * exists only so hover can answer synchronously. See `localWorld.ts`.
 */

import { useEffect, useState } from "react";

import { SeedsPool } from "../_lib/pool";
import { LocalWorld } from "../_lib/localWorld";

export interface SeedsEngine {
  pool: SeedsPool;
  local: LocalWorld;
  /**
   * The stack this engine was actually BUILT for, which is not the same thing
   * as the stack the tool currently wants — and consumers must key on this one.
   *
   * Ticking a pack changes `stackKey` one commit before this effect replaces
   * the engine, and React runs a child's effects before its parent's. A child
   * keyed on `stackKey` therefore rebuilds against the OUTGOING engine, whose
   * pool is disposed moments later by the cleanup below, and then never re-runs
   * because by the time the new engine arrives its key has not changed again.
   * The map held a terminated pool, queued tiles nobody would ever answer, and
   * went blank for the rest of the session.
   */
  key: string;
}

export function useSeedsEngine(stackKey: string): SeedsEngine | null {
  const [engine, setEngine] = useState<SeedsEngine | null>(null);

  useEffect(() => {
    const next: SeedsEngine = { pool: new SeedsPool(), local: new LocalWorld(), key: stackKey };
    setEngine(next);
    return () => {
      setEngine(null);
      next.pool.dispose();
      next.local.dispose();
    };
  }, [stackKey]);

  return engine;
}
