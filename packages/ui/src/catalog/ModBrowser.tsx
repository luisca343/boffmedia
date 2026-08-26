"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "../cn";
import type { Translate } from "../i18n";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Icon } from "../primitives/icon";
import { Input } from "../primitives/input";
import { Modal } from "../primitives/modal";
import { Seg } from "../primitives/seg";
import { Select } from "../primitives/select";
import { Spinner } from "../primitives/spinner";
import { CatalogIcon } from "./CatalogIcon";
import { getCatalog } from "./client";
import { effectiveLoader, isViaConnector } from "./connector";
import { ProjectDescription } from "./ProjectDescription";
import { toSummaryText } from "./descriptionText";
import type {
  CatalogCategory,
  CatalogLoader,
  CatalogProjectType,
  CatalogSort,
  ModFile,
  ModPlatform,
  ModProject,
  ModSearchHit,
} from "./types";

// The browse half of the picker: catalog on the left, project detail on the
// right. Everything is filtered by the pack's Minecraft/loader pair, which is
// the whole reason a mod picked here is guaranteed to be installable.
//
// `t` is a prop rather than `useT()` on purpose: the ui runtime's translator is
// bound to the primitives namespace, and these strings live in each host's own
// namespace (or, in the launcher, in a plain dictionary).

// 50, not 20: at ~260px per card a wide window fits three or four per row, so
// twenty results left the grid visibly half-empty and made the first scroll a
// click. Modrinth's own ceiling is 100, but that is 100 icon fetches on a cold
// cache for results most players never scroll to.
const PAGE_SIZE = 50;

const ALL_PLATFORMS: ModPlatform[] = ["modrinth", "curseforge"];
const ALL_SORTS: CatalogSort[] = [
  "downloads",
  "follows",
  "updated",
  "relevance",
  "name",
];
const ALL_TYPES: CatalogProjectType[] = [
  "mod",
  "resourcepack",
  "shader",
  "datapack",
];

/** `projectType` is the browser's current tab, carried on the pick because the
 *  target folder cannot be derived from the file alone: a shader and a resource
 *  pack are both a `.zip`, and only the tab the player picked from says which
 *  one this is. */
export type BrowsePick = {
  hit: ModSearchHit;
  file: ModFile;
  projectType: CatalogProjectType;
  /** True when this project does not publish the pack's own loader and is only
   *  installable because Connector is on. The host needs it for two things the
   *  file alone cannot answer: whether to pull Connector into the pack, and what
   *  to record on the manifest entry so the pack page can badge it later. */
  viaConnector: boolean;
};

/** How a host offers Connector mode. Absent means the pack cannot use it — no
 *  toggle is rendered at all, which is the case for every Fabric or Quilt pack
 *  and for any Minecraft version Connector has not shipped for. */
export type ConnectorControl = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function compactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

// Description/summary text is normalised by `descriptionText`, which is shared
// so every surface that shows catalogue prose strips the same things. The old
// local version stripped HTML tags only: it left `&amp;`/`&#39;` on screen and
// rendered Modrinth's Markdown verbatim, headings and all.

export function ModBrowser({
  t,
  platform,
  onPlatformChange,
  platforms = ALL_PLATFORMS,
  sorts = ALL_SORTS,
  projectTypes = ALL_TYPES,
  gameVersion,
  loader,
  connector,
  isAdded,
  installedVersionOf,
  onAdd,
  busyKey,
}: {
  t: Translate;
  platform: ModPlatform;
  onPlatformChange: (platform: ModPlatform) => void;
  /** Which platforms this host can actually reach. With one entry the toggle
   *  is hidden rather than rendered as a single dead button — the launcher
   *  only ever speaks to Modrinth. */
  platforms?: ModPlatform[];
  /** Not every platform supports every sort (Modrinth has no name sort), so
   *  the host narrows the list instead of the browser offering a dead option. */
  sorts?: CatalogSort[];
  projectTypes?: CatalogProjectType[];
  /** The pack's target Minecraft version. Required for every type except
   *  `modpack`, which brings its own — see `needsGameVersion`. */
  gameVersion: string;
  loader?: CatalogLoader;
  /** Present only when this pack's Minecraft/loader pair can actually run
   *  Connector — the host resolves that with `connectorSupport()`. */
  connector?: ConnectorControl;
  isAdded: (platform: ModPlatform, projectId: string) => boolean;
  /** The version of this project the pack already has, or null.
   *
   *  Project-level `isAdded` cannot answer the question the version list asks:
   *  a mod can be in the pack at 1.0.6 while the list is showing 1.0.7, and an
   *  "Añadir" button on the row you are already running is the one row where it
   *  is wrong. Optional, so a host with no notion of an installed version — the
   *  web admin building a version from scratch — behaves exactly as before. */
  installedVersionOf?: (
    platform: ModPlatform,
    projectId: string,
  ) => string | null;
  onAdd: (pick: BrowsePick) => void | Promise<void>;
  busyKey: string | null;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [projectType, setProjectType] = useState<CatalogProjectType>(
    projectTypes[0] ?? "mod",
  );
  const [sort, setSort] = useState<CatalogSort>(sorts[0] ?? "downloads");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [hits, setHits] = useState<ModSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ModSearchHit | null>(null);

  const searchSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Connector widens a MOD search and nothing else: it hosts Fabric mods, and a
  // resource pack or shader has no loader to widen in the first place. Scoped to
  // Modrinth because that is the only search with an OR-able loader facet.
  const connectorOn =
    Boolean(connector?.enabled) &&
    platform === "modrinth" &&
    projectType === "mod";

  // Any filter change restarts paging: appending page 2 of the new filters to
  // page 1 of the old ones is how a picker shows mods that do not match.
  useEffect(() => {
    setPage(0);
    setHits([]);
  }, [
    debounced,
    platform,
    projectType,
    sort,
    category,
    gameVersion,
    loader,
    connectorOn,
  ]);

  useEffect(() => {
    setCategory("");
    let live = true;
    void getCatalog()
      .categories(platform, projectType)
      .then((res) => {
        if (live) setCategories(res);
      })
      .catch(() => {
        if (live) setCategories([]);
      });
    return () => {
      live = false;
    };
  }, [platform, projectType]);

  // A modpack DEFINES its Minecraft version rather than targeting one, so it
  // is the one type that can be browsed before a version is chosen. Everything
  // else filters by it, and searching without it returns mods that will not
  // load.
  const needsGameVersion = projectType !== "modpack";

  useEffect(() => {
    if (needsGameVersion && !gameVersion) {
      setHits([]);
      setTotal(0);
      return;
    }
    const seq = ++searchSeq.current;
    setLoading(true);
    void getCatalog()
      .search({
        platform,
        query: debounced || undefined,
        gameVersion: gameVersion || undefined,
        // Resource packs and shaders have no loader, and sending one filters
        // every result away.
        loader: projectType === "mod" ? loader : undefined,
        includeFabricViaConnector: connectorOn,
        sort,
        category: category || undefined,
        projectType,
        page,
        pageSize: PAGE_SIZE,
      })
      .catch(() => ({ hits: [], total: 0 }))
      .then((data) => {
        if (seq !== searchSeq.current) return;
        setHits((current) =>
          page === 0 ? data.hits : [...current, ...data.hits],
        );
        setTotal(data.total);
        setLoading(false);
      });
  }, [
    platform,
    debounced,
    gameVersion,
    loader,
    sort,
    category,
    projectType,
    page,
    needsGameVersion,
    connectorOn,
  ]);

  // ProjectDetail knows the hit and the file but not which tab they came from,
  // so the browser stamps the type on the way out. One place, rather than a
  // prop threaded through both ProjectDetail mounts.
  //
  // `viaConnector` is stamped here for the same reason: it is a fact about the
  // project against THIS pack's loader, which the detail pane has no business
  // recomputing.
  const addPick = (pick: { hit: ModSearchHit; file: ModFile }) =>
    onAdd({
      ...pick,
      projectType,
      viaConnector: isViaConnector(pick.hit, loader, connectorOn),
    });

  // A Fabric-only project has no NeoForge files, so asking the detail pane for
  // them returns an empty list and the player is shown a mod with nothing to
  // install. The pack's own loader still wins wherever the project publishes it,
  // which is most of them — sodium, iris and lithium are all dual-loader.
  const detailLoader = effectiveLoader(
    selected ?? { categories: [], platform: "modrinth" },
    projectType === "mod" ? loader : undefined,
    connectorOn,
  );

  const canLoadMore = hits.length > 0 && hits.length < total && !loading;

  // Infinite scroll. The sentinel sits after the last card INSIDE the grid,
  // which is the element that actually scrolls (the page itself never grows),
  // so that element has to be the observer root — against the viewport the
  // sentinel would never intersect and the grid would simply stop at page 1.
  //
  // `canLoadMore` is in the dependency list rather than read inside the
  // callback: it is what goes false the moment a page starts loading, and
  // re-running the effect is what disconnects the observer for the duration.
  // Without that, one flick of the wheel queues three pages at once.
  const listRef = useRef<HTMLUListElement | null>(null);
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const root = listRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPage((p) => p + 1);
      },
      // A page ahead of the fold, so the next batch is usually already there
      // by the time the player reaches the bottom.
      { root, rootMargin: "600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore]);

  if (needsGameVersion && !gameVersion) {
    return (
      <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
        {t("needMinecraftLead")}
      </p>
    );
  }

  return (
    // flex-1 rather than h-full: the selector column also holds a progress
    // line, and 100% height would overflow it whenever that line shows.
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {platforms.length > 1 && (
          <Seg
            value={platform}
            onChange={(v) => {
              onPlatformChange(v as ModPlatform);
              setSelected(null);
            }}
            options={platforms.map((p) => ({
              value: p,
              label:
                p === "modrinth"
                  ? t("platformModrinth")
                  : t("platformCurseforge"),
            }))}
          />
        )}
        <div className="min-w-[200px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modSearchPlaceholder")}
          />
        </div>
        {projectTypes.length > 1 && (
          <div className="w-[150px]">
            <Select
              value={projectType}
              onChange={(v) => setProjectType(v as CatalogProjectType)}
              ariaLabel={t("projectType")}
              options={projectTypes.map((p) => ({
                value: p,
                label: t(`type.${p}`),
              }))}
            />
          </div>
        )}
        <div className="w-[150px]">
          <Select
            value={sort}
            onChange={(v) => setSort(v as CatalogSort)}
            ariaLabel={t("sort")}
            options={sorts.map((s) => ({ value: s, label: t(`sortBy.${s}`) }))}
          />
        </div>
        {/* Only for a mod browse: on the shader or resource-pack tab the toggle
            would still render but change nothing, which reads as broken. */}
        {connector && projectType === "mod" && platform === "modrinth" && (
          <label
            className="flex shrink-0 cursor-pointer items-center gap-[6px] font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim"
            title={t("connectorHint")}
          >
            <input
              type="checkbox"
              checked={connector.enabled}
              onChange={(e) => {
                connector.onChange(e.target.checked);
                setSelected(null);
              }}
              className="size-[13px] accent-[var(--accent)]"
            />
            {t("connectorToggle")}
          </label>
        )}
        {loading && <Spinner size={16} className="text-txt-muted" />}
      </div>

      {/* Stated once, above the results, rather than repeated on every Fabric
          card: Connector makes these mods REACHABLE, it does not make them all
          work. Mods with deep Fabric-internal mixins still fail, and there is no
          catalog field that would let us filter them out for the player. */}
      {connectorOn && (
        <p className="shrink-0 border border-solid border-line bg-panel px-3 py-2 font-body text-[11px] text-txt-dim">
          {t("connectorNote")}
        </p>
      )}

      {/* The three panes each own their scroll, so the page itself never grows:
          categories · results · the selected project. */}
      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="hidden w-[180px] shrink-0 flex-col gap-1 md:flex">
          <span className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            {t("categories")}
          </span>
          <ul className="bm-scroll flex min-h-0 flex-1 flex-col overflow-auto">
            <li>
              <button
                type="button"
                onClick={() => setCategory("")}
                className={cn(
                  "w-full px-2 py-[5px] text-left font-body text-[12px]",
                  category === ""
                    ? "bg-panel-2 text-acc"
                    : "text-txt-dim hover:text-txt",
                )}
              >
                {t("allCategories")}
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "w-full truncate px-2 py-[5px] text-left font-body text-[12px] capitalize",
                    category === c.id
                      ? "bg-panel-2 text-acc"
                      : "text-txt-dim hover:text-txt",
                  )}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {hits.length === 0 && !loading ? (
            <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
              {t("noModResults")}
            </p>
          ) : (
            <>
              {/* auto-fill, not a fixed column count: a 2560px screen shows five
                  cards per row instead of two very wide ones. */}
              <ul
                ref={listRef}
                className="bm-scroll grid min-h-0 flex-1 auto-rows-min content-start gap-2 overflow-auto pr-1 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]"
              >
                {hits.map((hit) => {
                  const added = isAdded(hit.platform, hit.projectId);
                  const viaConnector = isViaConnector(hit, loader, connectorOn);
                  return (
                    <li
                      key={`${hit.platform}:${hit.projectId}`}
                      className="h-full"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(hit)}
                        className={cn(
                          "flex h-full w-full items-start gap-2 border border-solid bg-panel px-2 py-2 text-left",
                          selected?.projectId === hit.projectId
                            ? "border-acc"
                            : "border-line",
                        )}
                      >
                        <CatalogIcon src={hit.iconUrl} size={40} />
                        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                              {hit.name}
                            </span>
                            {/* `new`, not `info`: the hosts already spend `info`
                                on the platform badge in the selected list, and
                                the Fabric marker has to read the same in both
                                places to be recognisable. */}
                            {viaConnector && (
                              <Badge tone="new" className="shrink-0">
                                {t("loaderFabric")}
                              </Badge>
                            )}
                            {added && (
                              <Badge tone="ok" className="shrink-0">
                                {t("added")}
                              </Badge>
                            )}
                          </span>
                          <span className="line-clamp-1 font-body text-[11px] text-txt-dim">
                            {toSummaryText(hit.summary)}
                          </span>
                          <span className="mt-auto flex items-center gap-2 font-mono text-[10px] text-txt-muted">
                            <Icon name="download" size={11} />
                            {compactCount(hit.downloads)}
                            {hit.author ? ` · ${hit.author}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {/* Zero-height and spanning every column so it never disturbs
                    the grid's flow, but still a real box the observer can see. */}
                <li
                  ref={sentinelRef}
                  aria-hidden
                  className="col-span-full h-px"
                />
              </ul>
              {/* Kept as a fallback, not as the primary affordance: the
                  observer normally fires first, and this is what a player who
                  reaches the bottom mid-fetch (or on a host without
                  IntersectionObserver) still has to click. */}
              {canLoadMore && (
                <div className="mt-2 flex shrink-0 justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("loadMore", { shown: hits.length, total })}
                  </Button>
                </div>
              )}
              {loading && hits.length > 0 && (
                <div className="mt-2 flex shrink-0 justify-center">
                  <Spinner size={14} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* A modal rather than a third pane. The pane was 400px holding a version
          row of seven fields, a capped description and a capped file list, and
          it had to exist TWICE — one `lg:block` copy and one `lg:hidden` copy
          below the grid — which is its own bug surface: a fix applied to one
          mount silently misses the other. One mount, and the grid gets the
          width the pane was taking. */}
      {selected && (
        <ProjectDetail
          t={t}
          hit={selected}
          gameVersion={needsGameVersion ? gameVersion : ""}
          loader={detailLoader}
          viaConnector={isViaConnector(selected, loader, connectorOn)}
          onClose={() => setSelected(null)}
          installedVersionOf={installedVersionOf}
          onAdd={addPick}
          busyKey={busyKey}
        />
      )}
    </div>
  );
}

function ProjectDetail({
  t,
  hit,
  gameVersion,
  loader,
  viaConnector,
  onClose,
  installedVersionOf,
  onAdd,
  busyKey,
}: {
  t: Translate;
  hit: ModSearchHit;
  gameVersion: string;
  loader?: CatalogLoader;
  /** Shown as a badge here too: this is the last screen before the mod is
   *  added, so it is the right place to say it is a Fabric jar. */
  viaConnector: boolean;
  onClose: () => void;
  /** Deliberately narrower than `BrowsePick`: the detail pane has no idea which
   *  tab it was opened from, and the browser stamps `projectType` on before
   *  handing the pick to the host. */
  installedVersionOf?: (
    platform: ModPlatform,
    projectId: string,
  ) => string | null;
  onAdd: (pick: { hit: ModSearchHit; file: ModFile }) => void | Promise<void>;
  busyKey: string | null;
}) {
  const [project, setProject] = useState<ModProject | null>(null);
  const [files, setFiles] = useState<ModFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllFiles, setShowAllFiles] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setProject(null);
    setFiles([]);
    const catalog = getCatalog();

    void Promise.all([
      catalog.project(hit.platform, hit.projectId).catch(() => null),
      catalog
        .files(hit.platform, hit.projectId, {
          // An empty string is "no target version" (a modpack browse), not a
          // version to match — sending it would filter every file away.
          gameVersion: showAllFiles ? undefined : gameVersion || undefined,
          loader: showAllFiles ? undefined : loader,
          pageSize: 50,
        })
        .catch(() => [] as ModFile[]),
    ]).then(([detail, fileList]) => {
      if (!live) return;
      setProject(detail);
      setFiles(fileList);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [hit.platform, hit.projectId, gameVersion, loader, showAllFiles]);

  // The project body, rendered rather than flattened — this pane is where the
  // player decides whether to add the mod, and a feature list stripped to one
  // run-on paragraph is the part that made that hard.
  const description = project?.description || project?.summary || "";
  return (
    <Modal
      open
      onClose={onClose}
      title={hit.name}
      // Wider than the `lg` preset's 760px: a version row carries seven fields,
      // and the whole point of moving off the 400px pane was that they stop
      // wrapping. The fixed height on md+ keeps the panel from resizing as the
      // player clicks from a mod with one version to a mod with forty.
      //
      // Both caps are ceilings, not sizes — `max-w` and the `min()` mean a
      // small window still gets a modal that fits it, and only a large one
      // spends the extra room. The description is the half that benefits:
      // rendered Markdown has headings, lists and screenshots to lay out.
      //
      // The 3rem is NOT a spare-room guess: the overlay is `p-6`, so it is
      // exactly the padding this modal sits inside. Raising the pixel cap is
      // free; shrinking that subtraction overflows the viewport.
      className="max-w-[1320px] md:h-[min(880px,calc(100dvh-3rem))]"
      // On md+ the body must NOT scroll as one — each column owns its own
      // scroll, so the version list stays put while a long description moves.
      // Stacked on narrow, one scroll for the whole thing is the right feel.
      bodyClassName="p-0 overflow-y-auto md:overflow-hidden"
    >
      <div className="flex min-h-0 flex-col md:h-full md:flex-row">
        {/* The description column. Widened well past the version list's needs:
            a version row is a fixed set of short fields and stops improving
            with more space, whereas prose keeps getting easier to read — so
            the extra width goes here rather than being split evenly. */}
        <aside className="bm-scroll flex shrink-0 flex-col gap-3 border-b border-solid border-line p-4 md:min-h-0 md:w-[420px] md:overflow-y-auto md:border-b-0 md:border-r lg:w-[520px] xl:w-[600px]">
          <div className="flex items-start gap-3">
            <CatalogIcon src={hit.iconUrl} size={56} />
            <div className="min-w-0 flex-1">
              <p className="font-body text-[12px] text-txt-dim">
                {toSummaryText(hit.summary)}
              </p>
              <span className="mt-1 flex items-center gap-2 font-mono text-[10px] text-txt-muted">
                <Icon name="download" size={11} />
                {compactCount(hit.downloads)}
                {hit.author ? ` · ${hit.author}` : ""}
              </span>
            </div>
          </div>

          {(viaConnector ||
            (project?.clientSide && project.clientSide !== "unknown") ||
            (project?.serverSide && project.serverSide !== "unknown")) && (
            <div className="flex flex-wrap items-center gap-2">
              {/* First, and in the browser's colour: this is the last screen
                  before the jar is added, so "this one is Fabric" belongs where
                  the player is already looking. */}
              {viaConnector && <Badge tone="new">{t("loaderFabric")}</Badge>}
              {project?.clientSide && project.clientSide !== "unknown" && (
                <Badge
                  tone={project.clientSide === "required" ? "info" : "warn"}
                >
                  {t(`side.client.${project.clientSide}`)}
                </Badge>
              )}
              {project?.serverSide && project.serverSide !== "unknown" && (
                <Badge
                  tone={project.serverSide === "required" ? "info" : "warn"}
                >
                  {t(`side.server.${project.serverSide}`)}
                </Badge>
              )}
            </div>
          )}

          {(project?.categories ?? hit.categories).length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] capitalize text-txt-muted">
              {(project?.categories ?? hit.categories).slice(0, 8).map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          )}

          {/* No max-height any more: the column scrolls, so a long description
              is read by scrolling rather than through a 120px porthole. */}
          {description && <ProjectDescription markup={description} />}

          {project &&
            (project.sourceUrl || project.issuesUrl || project.websiteUrl) && (
              <div className="mt-auto flex flex-wrap gap-3 pt-2 font-mono text-[11px]">
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-acc"
                  >
                    {t("linkSource")}
                  </a>
                )}
                {project.issuesUrl && (
                  <a
                    href={project.issuesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-acc"
                  >
                    {t("linkIssues")}
                  </a>
                )}
                {project.websiteUrl && (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-acc"
                  >
                    {t("linkWebsite")}
                  </a>
                )}
              </div>
            )}
        </aside>

        <section className="flex min-h-0 flex-1 flex-col p-4 md:overflow-hidden">
          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
              {t("files")}
            </span>
            <Seg
              value={showAllFiles ? "all" : "compatible"}
              onChange={(v) => setShowAllFiles(v === "all")}
              options={[
                { value: "compatible", label: t("compatibleOnly") },
                { value: "all", label: t("allFiles") },
              ]}
            />
          </div>

          {loading ? (
            <span className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
              <Spinner size={12} /> {t("loadingFiles")}
            </span>
          ) : files.length === 0 ? (
            <p className="font-body text-[12px] text-txt-dim">
              {t("noCompatibleFiles")}
            </p>
          ) : (
            <ul className="bm-scroll flex min-h-0 flex-1 flex-col gap-1 md:overflow-y-auto">
              {files.map((file) => {
                // Compared against `fileId`, which for Modrinth IS the version
                // id — the same value the manifest's `source.versionId` holds.
                const installedVersion =
                  installedVersionOf?.(hit.platform, hit.projectId) ?? null;
                const key = `${hit.platform}:${hit.projectId}:${file.fileId}`;
                const busy = busyKey === key;
                const requiredDeps = file.dependencies.filter(
                  (d) => d.relation === "required",
                ).length;
                return (
                  <li
                    key={file.fileId}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-solid border-line bg-panel-2 px-2 py-2"
                  >
                    <Badge
                      tone={file.releaseType === "release" ? "ok" : "warn"}
                      className="shrink-0"
                    >
                      {t(`releaseType.${file.releaseType}`)}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-txt-muted">
                      {file.fileName}
                    </span>
                    {installedVersion === file.fileId ? (
                      /* The version the pack already has. A badge rather than a
                         disabled button: disabled reads as "not allowed yet"
                         and invites a second click, where this is a statement of
                         fact. Every OTHER version keeps its button — picking one
                         is how an update or a downgrade is done. */
                      <Badge tone="ok" className="shrink-0">
                        {t("installed")}
                      </Badge>
                    ) : file.downloadable ? (
                      <Button
                        size="sm"
                        icon="plus"
                        loading={busy}
                        disabled={busyKey !== null}
                        // Closes on success so the player lands back on the
                        // grid with the card now marked "added". A pane could
                        // stay open because it sat BESIDE the results; a modal
                        // covers them, and there is never a second version of
                        // the same mod to pick. A throw leaves it open on
                        // purpose — the host toasts the reason, and closing
                        // would hide the row it refers to.
                        onClick={async () => {
                          await onAdd({ hit, file });
                          onClose();
                        }}
                        className="shrink-0"
                      >
                        {busy ? t("resolving") : t("addMod")}
                      </Button>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-bad">
                        <Icon name="alert" size={12} />
                        {t("notDistributable")}
                      </span>
                    )}
                    {/* `w-full` drops the metadata onto its own line under the
                        filename. With the Add button sharing the first line, one
                        row of seven fields would still wrap at any width this
                        modal can offer. */}
                    <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-txt-dim">
                      {file.versionNumber && <span>{file.versionNumber}</span>}
                      <span>
                        {file.gameVersions
                          .filter((v) => /^\d/.test(v))
                          .slice(0, 4)
                          .join(", ")}
                      </span>
                      <span>{formatSize(file.fileSize)}</span>
                      <span>{file.datePublished.slice(0, 10)}</span>
                      {requiredDeps > 0 && (
                        <Badge tone="info">
                          {t("depsCount", { count: requiredDeps })}
                        </Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {files.some((f) => !f.downloadable) && (
            <p className="mt-2 shrink-0 font-body text-[12px] text-bad">
              {t("notDistributableLead")}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
