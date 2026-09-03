"use client";

/**
 * SeedFinderTool — build a pack stack, bind a seed, look at the world.
 *
 * The tuning loop and the seed search are not here yet. What is here is the
 * part that carried all the architectural risk — real packs, a real evaluator,
 * a real map — plus the display work that makes the map worth looking at.
 *
 * The screen is arranged around one distinction, which is the same split the
 * worker API is built on: things that change *the world* (pack stack, seed)
 * cost seconds, and things that change *the picture* (view mode, relief, grid,
 * biome filter) cost milliseconds and apply the instant you touch them.
 *
 * Nothing needs pressing to get started. The default stack and seed load on
 * mount, because a tool page you navigated to on purpose should not open with
 * an empty frame and a button.
 *
 * It also never scrolls, and it has no header of its own. The tool declares
 * `layout: "viewport"`, so the host hands it a fixed box holding exactly two
 * things: a sidebar that scrolls on its own, and the map. That is not only a
 * layout preference — a large map inside a scrolling document has to choose
 * between owning the wheel (and trapping the reader) or ignoring it (and being
 * inert). Owning the screen removes the choice.
 *
 * Nothing is reported in chrome that has somewhere better to live. The biome
 * count belongs beside the biome list it describes; sea level belongs next to
 * the surface height it gives meaning to, in the hover readout; spawn is a
 * point on the map, because that is what spawn *is*; and a pack audit that
 * passed is not news — only a failing one is, and that still speaks up.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Banner, Button, Checkbox, Field, Input, Panel, Seg, Select } from "@boffmedia/ui";
import { ASSET } from "@boffmedia/asset-paths";
import { saveFile } from "@boffmedia/tool-kit";

import { SEED_FINDER_NS, useToolT } from "../i18n";
import { CURATED_PACKS, resolvePackConflicts } from "./_lib/packSource";
import { createBiomeStyler } from "./_lib/biomeColors";
import { parseSeed } from "./_lib/seedInput";
import { blocksPerPixel, gridSpacingFor, type Quality } from "./_lib/mapMath";
import { readViewState, teleportCommand, writeViewState, type ViewState } from "./_lib/urlState";
import type { LoadStackResult, TileMode, WorkerPackRef } from "./_lib/worker/seeds-api";
import { searchPoolTarget } from "./_lib/pool";
import { hasPrefilter, IDLE_PROGRESS } from "./_lib/search";
import {
  buildRunBundle,
  packMismatch,
  packStack,
  parseRunBundle,
  runBundleCsv,
} from "./_lib/runBundle";
import { useSeedsEngine } from "./_hooks/useSeedsEngine";
import { SeedMap, type HoverInfo } from "./_components/SeedMap";
import { MapHud } from "./_components/MapHud";
import { BiomeFilter } from "./_components/BiomeFilter";
import { SpecPanel } from "./_components/SpecPanel";
import { SearchPanel } from "./_components/SearchPanel";
import { useSpecEvaluation } from "./_hooks/useSpecEvaluation";
import { useSeedSearch } from "./_hooks/useSeedSearch";
import { fromCoreSpec, scanHash, toCoreSpec, type UiSpec } from "./_spec/model";
import { DEFAULT_PRESET } from "./_spec/presets";

/**
 * Enough of a `UiSpec` to hand to the editor.
 *
 * The same three fields `useNamedSpecs` checks, for the same reason: a bundle
 * is a file off disk, and the editor indexes `locations` unguarded.
 */
function isUiSpec(value: unknown): value is UiSpec {
  return (
    !!value &&
    typeof value === "object" &&
    "origin" in value &&
    "scan" in value &&
    "locations" in value &&
    Array.isArray((value as UiSpec).locations)
  );
}

/** Vanilla is not optional: without it there are no base density functions to override. */
const REQUIRED_PACK = "vanilla";

/**
 * Continents is off by default. It is a legitimate part of the stack, but it
 * rewrites the continent shape wholesale — a world with it on is not a smaller
 * variation of vanilla+Terralith, it is a different world — so it belongs to a
 * deliberate choice rather than to whatever you happen to see first.
 */
const DEFAULT_PACKS = ["vanilla", "terralith"];

const DEFAULTS: ViewState = {
  seed: "0",
  packs: DEFAULT_PACKS,
  x: 0,
  z: 0,
  zoom: -1,
  mode: "biome",
  hillshade: true,
  grid: false,
  quality: "balanced",
};

export function SeedFinderTool() {
  const t = useToolT(SEED_FINDER_NS);

  // `useToolT` builds a fresh closure on every render, so `t` is a new identity
  // each time. Depending on it from an effect that also sets state is an
  // infinite loop: load -> render -> new `t` -> load. Read it through a ref
  // instead, and keep it out of every dependency array.
  const tRef = useRef(t);
  tRef.current = t;

  /**
   * The URL is the source of truth for the opening view, so a shared link lands
   * somewhere specific instead of always at the origin of seed 0 — but it
   * CANNOT be read while rendering.
   *
   * `readViewState` answers with the defaults when `window` is undefined and
   * with the hash otherwise, so reading it during render is precisely the
   * server/client branch React refuses: the server's HTML says zoom −1 and the
   * client's first render says zoom 1, and the whole tree is thrown away and
   * rebuilt. The hash is therefore read once, on mount, in an effect.
   *
   * `initial` starts as the defaults so the first render is identical on both
   * sides, and is overwritten by that effect before anything reads it for real
   * — see `hydrated` below, which is what holds the map back until then.
   */
  const initialRef = useRef<ViewState>(DEFAULTS);
  const initial = initialRef.current;

  /** False until the URL has been read. Nothing view-dependent mounts before it. */
  const [hydrated, setHydrated] = useState(false);

  const [enabled, setEnabled] = useState<string[]>(DEFAULTS.packs);
  const [seed, setSeed] = useState(DEFAULTS.seed);
  const [seedDraft, setSeedDraft] = useState(DEFAULTS.seed);
  const [mode, setMode] = useState<TileMode>(DEFAULTS.mode);
  const [hillshade, setHillshade] = useState(DEFAULTS.hillshade);
  const [grid, setGrid] = useState(DEFAULTS.grid);
  const [quality, setQuality] = useState<Quality>(DEFAULTS.quality);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  // Changing the stack must replace the isolates, not reconfigure them — the
  // registries are global. Keying the engine on the stack does that by remount.
  const stackKey = useMemo(() => enabled.slice().sort().join("+"), [enabled]);

  /**
   * Which packs an enabled pack rules out, and who ruled them out.
   *
   * The pair is shown greyed with a reason rather than silently unticking
   * itself when clicked: a box that refuses to stay checked reads as a bug,
   * where a disabled box with a sentence under it reads as a rule.
   */
  const blockedBy = useMemo(() => {
    const out = new Map<string, string>();
    for (const p of CURATED_PACKS) {
      if (!enabled.includes(p.id)) continue;
      for (const other of p.conflicts ?? []) if (!enabled.includes(other)) out.set(other, p.label);
    }
    return out;
  }, [enabled]);

  const conflictNote = useMemo(() => {
    const [id, blocker] = [...blockedBy.entries()][0] ?? [];
    if (!id) return null;
    const label = CURATED_PACKS.find((c) => c.id === id)?.label ?? id;
    return t("world.packConflict", { pack: label, other: blocker! });
  }, [blockedBy, t]);
  const engine = useSeedsEngine(stackKey);

  const [loaded, setLoaded] = useState<LoadStackResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worldVersion, setWorldVersion] = useState(0);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [picked, setPicked] = useState<{ x: number; z: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [spawn, setSpawn] = useState<{ x: number; z: number } | null>(null);
  const [view, setView] = useState({ x: DEFAULTS.x, z: DEFAULTS.z, zoom: DEFAULTS.zoom });
  const [tab, setTab] = useState<"map" | "search">("map");
  const [spec, setSpec] = useState<UiSpec>(() => fromCoreSpec(DEFAULT_PRESET.spec));
  const [focusSite, setFocusSite] = useState<{ x: number; z: number; n: number } | null>(null);
  const [searchCount, setSearchCount] = useState(1000);
  /**
   * Pool size during a search, chosen by the user.
   *
   * Zero means "not decided yet" rather than "no workers": the real default
   * depends on `navigator.hardwareConcurrency`, which cannot be read while
   * rendering without breaking hydration, so it is filled in on mount like
   * every other client-only value here.
   */
  const [workerTarget, setWorkerTarget] = useState(0);
  const [survivorRate, setSurvivorRate] = useState<number | null>(null);

  const styler = useMemo(() => (loaded ? createBiomeStyler(loaded.packColors) : null), [loaded]);
  const parsedSeed = useMemo(() => parseSeed(seed), [seed]);

  /**
   * Read the URL, once, after mount. See `initialRef` for why this cannot
   * happen during render.
   *
   * Every setter is called in one effect so React batches them into a single
   * re-render: the tool goes from "defaults" to "the shared link's view" in one
   * commit rather than flashing through several.
   */
  useEffect(() => {
    const url = readViewState(DEFAULTS);
    initialRef.current = url;
    setEnabled(resolvePackConflicts(url.packs));
    setSeed(url.seed);
    setSeedDraft(url.seed);
    setMode(url.mode);
    setHillshade(url.hillshade);
    setGrid(url.grid);
    setQuality(url.quality);
    setView({ x: url.x, z: url.z, zoom: url.zoom });
    setWorkerTarget(searchPoolTarget());
    setHydrated(true);
  }, []);

  /**
   * Load the stack, bind the seed, find spawn. Runs on mount and whenever the
   * stack or seed changes — there is no button, because there is no decision
   * here the user has not already made by changing something.
   */
  useEffect(() => {
    if (!engine) return;
    let cancelled = false;

    void (async () => {
      setBusy(true);
      setError(null);
      setSpawn(null);
      try {
        const refs: WorkerPackRef[] = CURATED_PACKS.filter((p) => enabled.includes(p.id))
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ kind: "curated", id: p.id }));

        // `audit: true` here is the point: the inspect verdict is what tells the
        // user whether to believe the map, so it is never opt-in.
        const result = await engine.pool.loadStack(refs, {
          bundleBaseUrl: ASSET.boffmedia.tools.seeds,
          audit: true,
        });
        if (cancelled) return;

        await engine.pool.forSeed(parsedSeed.value.toString());
        if (cancelled) return;
        setLoaded(result);
        setWorldVersion((v) => v + 1);

        // The main-thread evaluator is built *after* the map is already
        // sampling, and never awaited before it: hover falls back to the painted
        // tile until this lands, so a ~50 ms block on the main thread never
        // delays the first tiles.
        await engine.local.load(refs, ASSET.boffmedia.tools.seeds);
        if (cancelled) return;
        engine.local.forSeed(parsedSeed.value.toString());
        setSpawn(engine.local.findSpawn());
      } catch (e) {
        if (!cancelled) {
          setError(tRef.current("error.load", { message: e instanceof Error ? e.message : String(e) }));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, enabled, parsedSeed]);

  // Keep the URL in step with whatever is on screen.
  //
  // Gated on `hydrated`, and that guard is load-bearing rather than tidy: on
  // the first commit this effect's closure still holds the DEFAULTS, so without
  // it the very first thing the tool would do is overwrite the hash it has not
  // read yet.
  useEffect(() => {
    if (!hydrated) return;
    writeViewState(
      { seed, packs: enabled, x: view.x, z: view.z, zoom: view.zoom, mode, hillshade, grid, quality },
      DEFAULTS,
    );
  }, [hydrated, seed, enabled, view, mode, hillshade, grid, quality]);

  const commitSeed = useCallback(() => {
    const next = seedDraft.trim();
    if (next !== seed) {
      setSeed(next);
      setPicked(null);
    }
  }, [seedDraft, seed]);

  const randomSeed = useCallback(() => {
    // 32 bits, not 64: a seed people might read aloud or retype, and the whole
    // 32-bit range is already more worlds than anyone will visit.
    const next = String((Math.random() * 2 ** 32) >>> 0);
    setSeedDraft(next);
    setSeed(next);
    setPicked(null);
  }, []);

  const pick = useCallback((x: number, z: number) => {
    setPicked({ x, z });
    setCopied(false);
  }, []);

  const copyTp = useCallback(async () => {
    if (!picked) return;
    try {
      await navigator.clipboard.writeText(teleportCommand(picked.x, picked.z));
      setCopied(true);
    } catch {
      // Clipboard access can be denied outright; saying nothing is better than
      // an error about a convenience.
    }
  }, [picked]);

  const onViewChange = useCallback((x: number, z: number, zoom: number) => {
    setView({ x, z, zoom });
  }, []);

  // Handed to SeedMap as a function rather than as the object itself: the pool
  // contains Comlink proxies, and React's dev render logger cannot walk one.
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const getEngine = useCallback(() => engineRef.current, []);
  /**
   * The stack the LIVE engine holds, which lags `stackKey` by one commit on a
   * pack change. `SeedMap` keys its whole Leaflet map on this, so it must not
   * be `stackKey` — see the note on `SeedsEngine.key`.
   */
  const engineKey = engine?.key ?? "";

  const audit = loaded?.inspect;
  const unknown = audit?.unknownTypes.length ?? 0;
  const runtime = audit?.runtimeModifiers.length ?? 0;
  const trustworthy = !!audit && unknown === 0 && runtime === 0;

  /* ------------------------------------------------------------- the spec -- */

  // The stack is not typed into the spec, it is read off the pack picker — see
  // `_spec/model.ts`. Sorted by load order, exactly as `loadStack` was given it,
  // because `mods` gates which copy of a conditional biome file applies.
  const packIds = useMemo(
    () =>
      CURATED_PACKS.filter((p) => enabled.includes(p.id))
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => p.id),
    [enabled],
  );

  const coreSpec = useMemo(() => toCoreSpec(spec, packIds), [spec, packIds]);
  const specScanKey = useMemo(() => scanHash(spec), [spec]);

  const specError = useCallback((message: string) => tRef.current("spec.error.evaluate", { message }), []);

  const evaluation = useSpecEvaluation(
    engine?.pool ?? null,
    coreSpec,
    parsedSeed.value.toString(),
    specScanKey,
    // Zero until the stack has loaded AND the seed is bound: evaluating before
    // that throws inside the worker rather than returning an empty verdict.
    loaded ? worldVersion : 0,
    specError,
  );

  /**
   * The 200-seed selectivity probe. Random rather than sequential, and the same
   * kind of seed a search would draw, so the rejection rate it reports is the
   * one a real run would see.
   */
  const testPrefilter = useCallback(async () => {
    if (!engine || !loaded) return null;
    const seeds: string[] = [];
    const buf = new BigUint64Array(200);
    crypto.getRandomValues(buf);
    // Reinterpreted as signed: Minecraft seeds are Java longs, and testing only
    // the non-negative half would measure a different population than a search
    // that draws from the whole range.
    for (const v of buf) seeds.push(BigInt.asIntN(64, v).toString());
    const sample = await engine.pool.prefilterBatch(coreSpec, seeds);
    // Remembered, because it is half of the pre-start estimate: how long a
    // search takes is set by how many seeds survive to a full evaluation.
    if (sample.tested > 0) setSurvivorRate(sample.passed / sample.tested);
    return sample;
  }, [engine, loaded, coreSpec]);

  const search = useSeedSearch(engine?.pool ?? null, coreSpec, spec);

  const [importedRun, setImportedRun] = useState<{
    exportedAt: string;
    packMismatch: readonly string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  /**
   * Write the run out, through the host rather than an `<a download>` — an
   * anchor click is inert in the launcher's webview, so the button would look
   * like it worked and write nothing.
   *
   * The specs come from the search's own snapshot, never from the editor:
   * exporting the spec currently on screen would attach whatever has been
   * typed since the search ran to results it did not judge.
   */
  const exportRun = useCallback(
    async (format: "json" | "csv") => {
      if (!search.hits.length) return;
      const stamp = new Date();
      const name = `seed-run-${stamp.toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

      if (format === "csv") {
        await saveFile({
          suggestedName: `${name}.csv`,
          data: new Blob([runBundleCsv(search.hits)], { type: "text/csv;charset=utf-8" }),
          mimeType: "text/csv",
          filters: [{ name: "CSV", extensions: ["csv"] }],
        });
        return;
      }

      const bundle = buildRunBundle({
        packs: packStack(enabled),
        // A snapshot is missing only for an imported run whose file predates
        // the field; the editor's copy is the honest fallback there.
        uiSpec: search.snapshot?.ui ?? spec,
        coreSpec: search.snapshot?.core ?? coreSpec,
        progress: search.progress,
        hits: search.hits,
        exportedAt: stamp.toISOString(),
      });
      await saveFile({
        suggestedName: `${name}.json`,
        data: new Blob([JSON.stringify(bundle)], { type: "application/json" }),
        mimeType: "application/json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
    },
    [search.hits, search.snapshot, search.progress, enabled, spec, coreSpec],
  );

  /**
   * Open a run and take on its spec.
   *
   * The editor is replaced by the spec that judged these seeds — reading a
   * score against a different spec is the mismatch the frozen snapshot exists
   * to prevent. The pack stack is NOT switched: a mismatch is reported and the
   * results open anyway, so a run whose packs have since been rebuilt is still
   * readable and is visibly labelled as measured against other data.
   */
  const openRun = useCallback(
    async (file: File) => {
      setImportError(null);
      try {
        const bundle = parseRunBundle(await file.text());
        // The editor's own state where the file has it, so the panel comes
        // back exactly as it was left. `fromCoreSpec` is the fallback, and
        // deliberately second: the round-trip through it is the step that has
        // been seen to change a spec, so it is used only when there is no
        // `ui` to prefer.
        setSpec(isUiSpec(bundle.spec.ui) ? bundle.spec.ui : fromCoreSpec(bundle.spec.core as Record<string, unknown>));
        search.load(
          bundle.hits,
          {
            ...IDLE_PROGRESS,
            total: bundle.run.total,
            checked: bundle.run.checked,
            evaluated: bundle.run.evaluated,
            hits: bundle.run.hits,
            dropped: bundle.run.dropped,
            elapsedMs: bundle.run.elapsedMs,
            attrition: bundle.run.attrition,
          },
          { core: bundle.spec.core, ui: bundle.spec.ui },
        );
        setImportedRun({
          exportedAt: bundle.exportedAt,
          packMismatch: packMismatch(bundle.packs, packStack(enabled)),
        });
        setTab("search");
      } catch (e) {
        setImportedRun(null);
        setImportError(e instanceof Error ? e.message : String(e));
      }
    },
    [search, enabled],
  );

  /**
   * What one seed costs for the spec on screen, kept from the last COLD
   * evaluation the editor ran. A warm one re-scores a cached grid and would
   * flatter the estimate by an order of magnitude, so only cold ones count.
   *
   * A ref feeds the state so a warm evaluation leaves the last real figure
   * standing instead of blanking the estimate every time a threshold is typed.
   */
  const [perSeedMs, setPerSeedMs] = useState<number | null>(null);
  useEffect(() => {
    const r = evaluation.result;
    if (r?.cold && typeof r.costMs === "number" && r.costMs > 0) setPerSeedMs(r.costMs);
  }, [evaluation.result]);

  // Cleared whenever a real search starts, so the imported banner cannot
  // outlive the results it describes.
  const startSearch = useCallback(() => {
    setImportedRun(null);
    setImportError(null);
    search.start(searchCount, { survivorRate: survivorRate ?? undefined, workerTarget, perSeedMs });
  }, [search, searchCount, survivorRate, workerTarget, perSeedMs]);

  // A spec with no prefilter evaluates every seed in full, so the survivor rate
  // the meter measures does not apply to it.
  const prefiltered = useMemo(() => hasPrefilter(coreSpec), [coreSpec]);

  /** Sites for the map: every location that resolved, pass or fail. */
  const sites = useMemo(() => {
    if (!evaluation.result) return undefined;
    return Object.entries(evaluation.result.locations).map(([name, loc]) => ({
      name,
      x: loc.x,
      z: loc.z,
      pass: loc.pass,
    }));
  }, [evaluation.result]);

  /** Put a found seed on the map. Same path as typing one into the box. */
  const pickSeed = useCallback((next: string) => {
    setSeedDraft(next);
    setSeed(next);
    setPicked(null);
  }, []);

  const showSite = useCallback((x: number, z: number) => {
    // `n` forces a new object even when the same site is clicked twice, so the
    // map's effect re-runs and recentres instead of ignoring an equal value.
    setFocusSite((prev) => ({ x, z, n: (prev?.n ?? 0) + 1 }));
  }, []);

  const bpp = blocksPerPixel(view.zoom);

  return (
    /* One screen, no page scroll, no header. `min-h-0` is what lets the sidebar
       scroll on its own instead of stretching the whole thing. */
    <div className="flex h-full min-h-0">
        {/* The only scrolling region besides the map itself. */}
        <aside className="flex w-[23.75rem] shrink-0 flex-col gap-3 overflow-y-auto border-r border-line-2 p-3">
          {/* One scroll region, two tabs. The map is never unmounted by a tab
              change — switching away from it must not throw away the sampled
              grids, which cost seconds, so the tabs gate the SIDEBAR only. */}
          <Seg
            className="w-full"
            value={tab}
            onChange={(v) => setTab(v as "map" | "search")}
            options={[
              { value: "map", label: t("tabs.map") },
              { value: "search", label: t("tabs.search") },
            ]}
          />

          {error ? <Banner tone="error">{error}</Banner> : null}

          {tab === "search" ? (
            <SpecPanel
              spec={spec}
              onChange={setSpec}
              biomeIds={loaded?.biomeIds ?? []}
              result={evaluation.result}
              evaluating={evaluation.evaluating}
              error={evaluation.error}
              seedLabel={seed}
              packIds={packIds}
              onFocusSite={showSite}
              onTestPrefilter={testPrefilter}
              t={t}
            />
          ) : null}

          {tab === "search" ? (
            <SearchPanel
              progress={search.progress}
              hits={search.hits}
              dropped={search.dropped}
              survivorRate={survivorRate}
              prefiltered={prefiltered}
              perSeedMs={perSeedMs}
              count={searchCount}
              onCountChange={setSearchCount}
              workerTarget={workerTarget}
              onWorkerTargetChange={setWorkerTarget}
              stackBytes={loaded?.bytes ?? 0}
              stackLoadMs={loaded ? loaded.ms.fetch + loaded.ms.build : 0}
              onStart={startSearch}
              onStop={search.stop}
              ready={!!loaded && spec.locations.length > 0}
              onExportRun={(format) => void exportRun(format)}
              onOpenRun={(file) => void openRun(file)}
              importedRun={importedRun}
              importError={importError}
              seedOnMap={seed}
              onPickSeed={pickSeed}
              onFocusSite={showSite}
              t={t}
            />
          ) : null}

          {tab === "map" ? (
            <>
              <Panel title={t("world.title")}>
            <div className="grid gap-3">
              <Field
                label={t("world.seed")}
                hint={
                  parsedSeed.kind === "hash"
                    ? t("world.seedHashed", { value: parsedSeed.value.toString() })
                    : t("world.seedHint")
                }
              >
                <div className="flex gap-2">
                  <Input
                    value={seedDraft}
                    onChange={(e) => setSeedDraft(e.target.value)}
                    onBlur={commitSeed}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitSeed();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="ghost" onClick={randomSeed} title={t("world.randomSeed")}>
                    {t("world.randomSeedShort")}
                  </Button>
                </div>
              </Field>

              <div className="grid gap-2">
                {CURATED_PACKS.map((p) => (
                  <Checkbox
                    key={p.id}
                    checked={enabled.includes(p.id)}
                    // Vanilla supplies the density functions every other pack
                    // overrides, so unchecking it would not build a smaller
                    // world, it would build no world at all.
                    disabled={p.id === REQUIRED_PACK || blockedBy.has(p.id)}
                    onChange={(on) =>
                      setEnabled((prev) =>
                        on
                          // Still filtered on the way in: a URL can carry a
                          // pair the picker itself would never let you build.
                          ? [...prev.filter((id) => !(p.conflicts ?? []).includes(id)), p.id]
                          : prev.filter((id) => id !== p.id),
                      )
                    }
                    label={`${p.label} ${p.version}`}
                  />
                ))}
                {conflictNote ? (
                  <p className="border-l-2 border-line pl-2 text-[0.625rem] leading-snug text-txt-dim">
                    {conflictNote}
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel title={t("view.title")}>
            <div className="grid gap-3">
              <Select
                label={t("world.mode")}
                value={mode}
                onChange={(v) => setMode(v as TileMode)}
                options={[
                  { value: "biome", label: t("world.modeBiome") },
                  { value: "terrain", label: t("world.modeTerrain") },
                  { value: "water", label: t("world.modeWater") },
                ]}
              />
              <Checkbox checked={hillshade} onChange={setHillshade} label={t("view.hillshade")} />
              <Checkbox checked={grid} onChange={setGrid} label={t("view.grid")} />
              <Select
                label={t("view.quality")}
                hint={t("view.qualityHint")}
                value={quality}
                onChange={(v) => setQuality(v as Quality)}
                options={[
                  { value: "full", label: t("view.qualityFull") },
                  { value: "balanced", label: t("view.qualityBalanced") },
                  { value: "fast", label: t("view.qualityFast") },
                ]}
              />
                </div>
              </Panel>
            </>
          ) : null}

          {loaded && tab === "map" ? (
            <Panel
              title={t("filter.title")}
              aside={
                <span className="font-mono text-[0.6875rem] text-txt-dim">
                  {t("filter.total", { n: loaded.describe.biomes.distinct })}
                </span>
              }
            >
              <BiomeFilter
                biomeIds={loaded.biomeIds}
                styler={styler}
                selected={highlight}
                onChange={setHighlight}
                labels={{
                  search: t("filter.search"),
                  clear: t("filter.clear"),
                  empty: t("filter.empty"),
                  count: t("filter.count", { n: highlight.size }),
                }}
              />
            </Panel>
          ) : null}

          {audit && !trustworthy ? (
            <div className="grid gap-2">
              {unknown > 0 ? <Banner tone="error">{t("trust.unknownTypes", { count: unknown })}</Banner> : null}
              {runtime > 0 ? <Banner tone="warn">{t("trust.runtimeModifiers", { count: runtime })}</Banner> : null}
            </div>
          ) : null}

          {/* Small, but never removed: every number this tool prints is still
              unvalidated against a real Minecraft world. */}
          <p className="mt-auto shrink-0 border-t border-line-2 pt-3 text-[0.6875rem] leading-snug text-txt-dim">
            {t("poc.body")}
          </p>
        </aside>

        <div className="relative min-w-0 flex-1">
          {/* Held back until the URL has been read: a child's effects run before
              its parent's, so an ungated SeedMap would build its Leaflet map
              with the default view one tick before the hash arrived, and
              `initialView` is only ever read at creation. */}
          {hydrated ? (
            <SeedMap
              getEngine={getEngine}
              engineKey={engineKey}
              styler={styler}
              mode={mode}
              hillshade={hillshade}
              grid={grid}
              quality={quality}
              highlight={highlight}
              spawn={spawn}
              spawnTitle={spawn ? t("world.spawnAt", { x: spawn.x, z: spawn.z }) : undefined}
              sites={sites}
              focus={focusSite}
              worldVersion={worldVersion}
              initialView={{ x: initial.x, z: initial.z, zoom: initial.zoom }}
              onHover={setHover}
              onPick={pick}
              onViewChange={onViewChange}
              className="absolute inset-0 !bg-base"
            />
          ) : null}
          <MapHud
            hover={hover}
            styler={styler}
            blocksPerPixel={bpp}
            seaLevel={loaded?.describe.seaLevel ?? null}
            labels={{
              hint: t("map.pickHint"),
              water: t("map.water"),
              land: t("map.land"),
              surface: t("map.surfaceShort"),
              sea: t("map.seaShort"),
              scale: `${t("map.perPixel", { n: bpp })} · ${t("map.gridSpacing", { n: gridSpacingFor(bpp) })}`,
            }}
          />

          {picked ? (
            <div className="absolute left-2 top-2 z-[500] flex items-center gap-3 border border-line-2 bg-panel px-3 py-1.5 font-mono text-[0.75rem] shadow-lg">
              <code className="text-txt">{teleportCommand(picked.x, picked.z)}</code>
              <Button size="sm" variant="ghost" onClick={copyTp}>
                {copied ? t("map.copied") : t("map.copyTp")}
              </Button>
            </div>
          ) : null}

          {busy ? (
            <div className="absolute right-2 top-2 z-[500] border border-line-2 bg-panel px-3 py-1.5 font-mono text-[0.75rem] text-txt-dim shadow-lg">
              {t("stack.building")}
            </div>
          ) : null}
      </div>
    </div>
  );
}
