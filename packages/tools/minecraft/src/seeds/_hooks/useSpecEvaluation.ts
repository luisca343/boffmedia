/**
 * useSpecEvaluation — keep a verdict in step with the spec being edited.
 *
 * The interesting part is not the request, it is the debounce and the ordering.
 *
 * **Debounce.** A constraint edit is a keystroke. Without a delay every digit
 * of "1200" fires an evaluation, and the first three are answers to specs the
 * user never meant. 250 ms is long enough to swallow typing and short enough
 * that letting go of a number feels like it answered immediately — which it
 * does, because a constraint-only edit hits the worker's warm `Session`.
 *
 * **Ordering.** Comlink calls resolve in whatever order the worker finishes
 * them, and a slow evaluation started before a fast one can land after it. A
 * monotonic token is compared on arrival so a stale answer is dropped rather
 * than painted; without it, editing quickly leaves the panel showing a verdict
 * for a spec that is no longer on screen.
 *
 * The hook holds no spec of its own. It is handed the serialised core spec and
 * the scan key, because deciding what counts as a scan change belongs to the
 * model, not here.
 */

import { useEffect, useRef, useState } from "react";

import type { SeedsPool } from "../_lib/pool";
import type { SpecEvalResult } from "../_lib/worker/seeds-api";

const DEBOUNCE_MS = 250;

export interface SpecEvaluation {
  result: SpecEvalResult | null;
  evaluating: boolean;
  error: string | null;
}

export function useSpecEvaluation(
  pool: SeedsPool | null,
  coreSpec: unknown,
  seed: string,
  scanKey: string,
  /** Bumped when the stack or seed finished loading — before that there is no world. */
  readyVersion: number,
  onError: (message: string) => string,
): SpecEvaluation {
  const [result, setResult] = useState<SpecEvalResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useRef(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Serialised so the effect compares by value. The spec object is rebuilt on
  // every keystroke — a reference dependency would re-run for edits that
  // changed nothing the evaluator can see, such as renaming a card to the same
  // name or toggling a field back.
  const specJson = JSON.stringify(coreSpec);

  useEffect(() => {
    if (!pool || readyVersion === 0) return;

    const spec = JSON.parse(specJson) as Record<string, unknown>;
    const locations = spec.locations as Record<string, unknown> | undefined;
    if (!locations || Object.keys(locations).length === 0) {
      setResult(null);
      setError(null);
      return;
    }

    const mine = ++token.current;
    const timer = setTimeout(() => {
      setEvaluating(true);
      void pool
        .evaluateSpec(spec, seed, scanKey)
        .then((r) => {
          if (mine !== token.current) return;
          setResult(r);
          setError(null);
        })
        .catch((e: unknown) => {
          if (mine !== token.current) return;
          setResult(null);
          setError(onErrorRef.current(e instanceof Error ? e.message : String(e)));
        })
        .finally(() => {
          if (mine === token.current) setEvaluating(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [pool, specJson, seed, scanKey, readyVersion]);

  return { result, evaluating, error };
}
