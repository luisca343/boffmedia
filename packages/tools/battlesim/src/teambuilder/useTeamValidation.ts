"use client";

/**
 * Pooled, debounced, cancel-safe team validation — and the format-aware move
 * list, which rides the same worker.
 *
 * ONE worker for the whole tool. The previous version started a worker per
 * hook instance, and the teams list mounts a hook per card — twelve teams meant
 * twelve copies of `@pkmn/sim` booting at once, which is the pause you felt
 * opening the tab. Now every subscriber shares a module-level worker and a
 * result cache keyed by `${format}\n${packed}`, so the list, the editor and the
 * play screen asking about the same team pay for one check.
 *
 * `useLegalMoves` is the second consumer of that worker rather than a worker of
 * its own, for exactly the same reason: `legalMovesFor` needs the modded dex,
 * and this one already has it warm. Its answers cache under
 * `${format}\n${speciesId}`.
 *
 * Answers can still arrive out of order, so every request carries a token and
 * is matched back to the key it was asked for. A key with no subscribers left
 * keeps its cached answer but cancels a debounce that has not fired.
 *
 * Validation is ADVISORY (D12): the editor shows problems and still saves.
 */

import { useEffect, useMemo, useState } from "react";

import type { BsimWorkerRequest, BsimWorkerResponse } from "./validate.worker";
import type { SpeciesPickerData } from "@boffmedia/battle-core";

const DEBOUNCE_MS = 300;
const CACHE_MAX = 200;
const IDLE_TERMINATE_MS = 90_000;

export interface TeamValidation {
  /** Null until the first answer for the current input. */
  ok: boolean | null;
  problems: string[];
  checking: boolean;
}

type Answer = { ok: boolean; problems: string[] };
type MovesAnswer = { moves: Set<string>; known: boolean };
type SpeciesAnswer = { species: Set<string>; known: boolean };
type AllSpeciesAnswer = { species: SpeciesPickerData[]; known: boolean };
type Listener = (answer: Answer) => void;
type MovesListener = (answer: MovesAnswer) => void;
type SpeciesListener = (answer: SpeciesAnswer) => void;
type AllSpeciesListener = (answer: AllSpeciesAnswer) => void;

const IDLE: TeamValidation = { ok: null, problems: [], checking: false };
const NO_MOVES: MovesAnswer = { moves: new Set<string>(), known: false };
const NO_SPECIES: SpeciesAnswer = { species: new Set<string>(), known: false };

const cache = new Map<string, Answer>();
const listeners = new Map<string, Set<Listener>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const movesCache = new Map<string, MovesAnswer>();
const movesListeners = new Map<string, Set<MovesListener>>();

// The roster is per FORMAT, not per species, so this cache stays tiny — one
// entry per format the builder has touched — and is worth keeping warm.
const speciesCache = new Map<string, SpeciesAnswer>();
const speciesListeners = new Map<string, Set<SpeciesListener>>();

// The all-species list is global and never changes within a session, so this
// cache is a single entry that survives the whole session.
const allSpeciesCache = new Map<"all-species", AllSpeciesAnswer>();
const allSpeciesListeners = new Set<AllSpeciesListener>();

/** token → which cache the reply belongs to, and under which key. */
const inflight = new Map<number, { kind: "validate" | "moves" | "species" | "all-species"; key: string }>();
let worker: Worker | null = null;
let token = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function remember<T>(store: Map<string, T>, key: string, answer: T) {
  store.set(key, answer);
  if (store.size > CACHE_MAX) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
}

function scheduleIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (inflight.size === 0 && timers.size === 0 && worker) {
      worker.terminate();
      worker = null;
    }
  }, IDLE_TERMINATE_MS);
}

function ensureWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  if (worker) return worker;
  // Static `new URL(..., import.meta.url)`: the shape both Vite and Next can
  // resolve statically. Neither can follow a computed worker path.
  const w = new Worker(new URL("./validate.worker.ts", import.meta.url), { type: "module" });
  w.onmessage = (event: MessageEvent<BsimWorkerResponse>) => {
    const reply = event.data;
    const pending = inflight.get(reply.token);
    if (!pending) return;
    inflight.delete(reply.token);
    if (reply.kind === "species") {
      const answer: SpeciesAnswer = { species: new Set(reply.species), known: reply.known };
      remember(speciesCache, pending.key, answer);
      speciesListeners.get(pending.key)?.forEach((fn) => fn(answer));
    } else if (reply.kind === "moves") {
      const answer: MovesAnswer = { moves: new Set(reply.moves), known: reply.known };
      remember(movesCache, pending.key, answer);
      movesListeners.get(pending.key)?.forEach((fn) => fn(answer));
    } else if (reply.kind === "all-species") {
      const answer: AllSpeciesAnswer = { species: reply.species, known: reply.known };
      allSpeciesCache.set("all-species", answer);
      allSpeciesListeners.forEach((fn) => fn(answer));
    } else {
      const answer: Answer = { ok: reply.ok, problems: reply.problems };
      remember(cache, pending.key, answer);
      listeners.get(pending.key)?.forEach((fn) => fn(answer));
    }
    scheduleIdle();
  };
  w.onerror = () => {
    // The worker is gone; drop it so the next request boots a fresh one, and
    // tell everyone waiting rather than leaving them on "checking" forever.
    // A failed move lookup answers `known: false` — the picker then shows the
    // full list, because a Pokémon that learns nothing is never the truth.
    const failed: Answer = { ok: false, problems: ["worker_failed"] };
    for (const pending of [...inflight.values()]) {
      if (pending.kind === "moves") movesListeners.get(pending.key)?.forEach((fn) => fn(NO_MOVES));
      else listeners.get(pending.key)?.forEach((fn) => fn(failed));
    }
    inflight.clear();
    w.terminate();
    if (worker === w) worker = null;
  };
  worker = w;
  return w;
}

/** Distributive: a plain `Omit` over the union keeps only the shared keys. */
type WithoutToken<T> = T extends unknown ? Omit<T, "token"> : never;

function send(request: WithoutToken<BsimWorkerRequest>, key: string): boolean {
  const w = ensureWorker();
  if (!w) return false;
  const id = ++token;
  inflight.set(id, { kind: request.kind, key });
  w.postMessage({ ...request, token: id } as BsimWorkerRequest);
  return true;
}

function subscribe(key: string, format: string, packed: string, fn: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);

  // Already asked and not yet answered: the reply will fan out to us too.
  const asked = [...inflight.values()].some((p) => p.kind === "validate" && p.key === key);
  if (!cache.has(key) && !asked && !timers.has(key)) {
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        if (listeners.get(key)?.size) send({ kind: "validate", format, packed }, key);
      }, DEBOUNCE_MS),
    );
  }

  return () => {
    const current = listeners.get(key);
    current?.delete(fn);
    if (current && current.size === 0) {
      listeners.delete(key);
      const timer = timers.get(key);
      if (timer) {
        clearTimeout(timer);
        timers.delete(key);
      }
    }
  };
}

/**
 * The move list has no debounce: it is asked once per (format, species), and
 * a species changes on a click rather than on a keystroke.
 */
function subscribeMoves(key: string, format: string, species: string, fn: MovesListener): () => void {
  let set = movesListeners.get(key);
  if (!set) {
    set = new Set();
    movesListeners.set(key, set);
  }
  set.add(fn);

  const asked = [...inflight.values()].some((p) => p.kind === "moves" && p.key === key);
  if (!movesCache.has(key) && !asked) {
    const sent = send({ kind: "moves", format, species }, key);
    // No `Worker` at all (SSR, a locked-down host): answer immediately with
    // "unknown" so nothing sits on a spinner that will never resolve.
    if (!sent) fn(NO_MOVES);
  }

  return () => {
    const current = movesListeners.get(key);
    current?.delete(fn);
    if (current && current.size === 0) movesListeners.delete(key);
  };
}

/**
 * The roster is asked once per format and never debounced: a format changes on
 * a click, and the answer is the same for all six slots.
 */
function subscribeSpecies(key: string, format: string, fn: SpeciesListener): () => void {
  let set = speciesListeners.get(key);
  if (!set) {
    set = new Set();
    speciesListeners.set(key, set);
  }
  set.add(fn);

  const asked = [...inflight.values()].some((p) => p.kind === "species" && p.key === key);
  if (!speciesCache.has(key) && !asked) {
    const sent = send({ kind: "species", format }, key);
    if (!sent) fn(NO_SPECIES);
  }

  return () => {
    const current = speciesListeners.get(key);
    current?.delete(fn);
    if (current && current.size === 0) speciesListeners.delete(key);
  };
}

export interface UseTeamValidationOptions {
  /** False keeps the hook idle — a card off-screen does not need an answer yet. */
  enabled?: boolean;
}

export function useTeamValidation(format: string, packed: string, options?: UseTeamValidationOptions): TeamValidation {
  const enabled = options?.enabled ?? true;
  const key = `${format}\n${packed}`;
  const [state, setState] = useState<TeamValidation>(() => {
    if (!packed || !enabled) return IDLE;
    const hit = cache.get(key);
    return hit ? { ...hit, checking: false } : { ok: null, problems: [], checking: true };
  });

  useEffect(() => {
    if (!packed || !enabled) {
      setState(IDLE);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setState({ ...hit, checking: false });
      return;
    }
    // Keep the previous problem list on screen while the new answer is on its
    // way: a list that empties on every keystroke reads as flicker, and the
    // `checking` flag is what the chip dims on.
    setState((s) => ({ ok: null, problems: s.problems, checking: true }));
    return subscribe(key, format, packed, (answer) => setState({ ...answer, checking: false }));
  }, [key, format, packed, enabled]);

  return state;
}

/** One-shot validation, for the play screen's "is this team legal" label. */
export function useTeamLegality(format: string, packed: string): boolean | null {
  return useTeamValidation(format, packed).ok;
}

export interface LegalMoves {
  /** The move ids this species may use in this format. Meaningless when `known` is false. */
  moves: Set<string>;
  /** False = no answer (unknown format or species, or the worker failed). Show everything. */
  known: boolean;
  loading: boolean;
}

const EMPTY_LEGAL: LegalMoves = { moves: new Set<string>(), known: false, loading: false };

const speciesKey = (species: string) => species.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * What `species` may legally use in `format`, answered by the pooled worker.
 *
 * `known: false` is a real answer and NOT an error state — the caller shows the
 * unfiltered list. `loading` is the only state where the caller should hold
 * off, so a slow first boot of the dex does not flash an empty picker.
 */
export function useLegalMoves(format: string, species: string): LegalMoves {
  const key = useMemo(() => `${format}\n${speciesKey(species)}`, [format, species]);
  const [state, setState] = useState<LegalMoves>(() => {
    if (!species) return EMPTY_LEGAL;
    const hit = movesCache.get(key);
    return hit ? { ...hit, loading: false } : { moves: new Set<string>(), known: false, loading: true };
  });

  useEffect(() => {
    if (!species) {
      setState(EMPTY_LEGAL);
      return;
    }
    const hit = movesCache.get(key);
    if (hit) {
      setState({ ...hit, loading: false });
      return;
    }
    setState({ moves: new Set<string>(), known: false, loading: true });
    return subscribeMoves(key, format, species, (answer) => setState({ ...answer, loading: false }));
  }, [key, format, species]);

  return state;
}

export interface LegalSpeciesPool {
  /** The species ids this format allows. Meaningless when `known` is false. */
  species: Set<string>;
  /** False = no answer (unknown format, or the worker failed). Mark nothing. */
  known: boolean;
  loading: boolean;
}

const EMPTY_POOL: LegalSpeciesPool = { species: new Set<string>(), known: false, loading: false };

/**
 * Which Pokémon `format` allows, answered by the pooled worker.
 *
 * Same contract as `useLegalMoves`, and the same reason for existing: the
 * picker marks what a regulation excludes instead of letting the validator be
 * the first thing that mentions it. `known: false` means "mark nothing" — a
 * failed lookup must never paint the entire dex red.
 */
export function useLegalSpecies(format: string): LegalSpeciesPool {
  const [state, setState] = useState<LegalSpeciesPool>(() => {
    if (!format) return EMPTY_POOL;
    const hit = speciesCache.get(format);
    return hit ? { ...hit, loading: false } : { species: new Set<string>(), known: false, loading: true };
  });

  useEffect(() => {
    if (!format) {
      setState(EMPTY_POOL);
      return;
    }
    const hit = speciesCache.get(format);
    if (hit) {
      setState({ ...hit, loading: false });
      return;
    }
    setState({ species: new Set<string>(), known: false, loading: true });
    return subscribeSpecies(format, format, (answer) => setState({ ...answer, loading: false }));
  }, [format]);

  return state;
}

export interface AllSpeciesPool {
  /** All available species with picker metadata (including modded). Meaningless when `known` is false. */
  species: SpeciesPickerData[];
  /** Always true; included for protocol consistency. */
  known: boolean;
  loading: boolean;
}

const EMPTY_ALL_SPECIES: AllSpeciesPool = { species: [], known: false, loading: false };

/**
 * All available species (including Champions Megas and Teras), answered by the
 * pooled worker. The species list is global and constant within a session.
 *
 * This is used by the teambuilder picker to populate its species list with all
 * available options, which are then filtered by format legality via
 * `useLegalSpecies`. `known: false` means the worker failed; show the
 * unfiltered list rather than an empty picker.
 */
export function useAllSpecies(): AllSpeciesPool {
  const [state, setState] = useState<AllSpeciesPool>(() => {
    const hit = allSpeciesCache.get("all-species");
    return hit ? { ...hit, loading: false } : { species: [], known: false, loading: true };
  });

  useEffect(() => {
    const hit = allSpeciesCache.get("all-species");
    if (hit) {
      setState({ ...hit, loading: false });
      return;
    }

    setState({ species: [], known: false, loading: true });

    const listener: AllSpeciesListener = (answer) => setState({ ...answer, loading: false });
    allSpeciesListeners.add(listener);

    const asked = [...inflight.values()].some((p) => p.kind === "all-species");
    if (!asked) {
      send({ kind: "all-species" }, "all-species");
    }

    return () => {
      allSpeciesListeners.delete(listener);
    };
  }, []);

  return state;
}
