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
}

export function useSeedsEngine(stackKey: string): SeedsEngine | null {
  const [engine, setEngine] = useState<SeedsEngine | null>(null);

  useEffect(() => {
    const next: SeedsEngine = { pool: new SeedsPool(), local: new LocalWorld() };
    setEngine(next);
    return () => {
      setEngine(null);
      next.pool.dispose();
      next.local.dispose();
    };
  }, [stackKey]);

  return engine;
}
