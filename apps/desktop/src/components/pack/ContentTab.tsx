import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import {
  Badge,
  Banner,
  Button,
  CatalogIcon,
  Empty,
  Icon,
  Input,
  Modal,
  Seg,
  Spinner,
  Toggle,
  ProjectModal,
  cn,
  getCatalog,
  projectUrl,
  toast,
} from "@boffmedia/ui";

import { useT } from "../../i18n";
import {
  instanceExtraDelete,
  instanceExtraSetEnabled,
  instanceModGraph,
  instanceOptionalSet,
  onContentFile,
} from "../../runtime";
import type { ModGraph } from "../../services/types";
import { removeFile, replaceFile } from "../../services/localPackEdit";
import { formatBytes } from "../../utils/format";
import { UpdateReview } from "./UpdateReview";
import {
  type ContentCategory,
  type ContentRow,
  categoryOf,
  findUpdates,
  usePackContent,
} from "./usePackContent";

// The installed half of the pack: what is in it, whether each file is switched
// on, and — for a local pack — the actions that change that.
//
// A MANAGED pack is deliberately read-only here. Its file list is the server's
// manifest, and the install pass re-derives it from that manifest every time;
// a delete or a version swap would be silently undone on the next launch, which
// is worse than not offering it. The optional-file toggles are the one
// exception, because the manifest itself declares those as the player's choice.

export function ContentTab({
  slug,
  isLocal,
  minecraft,
  loader,
  onBrowse,
  onChanged,
  refreshKey = 0,
}: {
  slug: string;
  isLocal: boolean;
  minecraft: string;
  loader: string | null;
  onBrowse: () => void;
  onChanged: () => void;
  /** Bumped by the page when an install or a launch finishes. The rows report
   *  what is on disk, and nothing inside this component knows that changed. */
  refreshKey?: number;
}) {
  const t = useT("content");
  const { rows, loading, reload, setRows } = usePackContent(
    slug,
    isLocal,
    true,
    refreshKey,
  );

  const CATEGORY_LABEL: Record<Exclude<ContentCategory, "all">, string> = {
    mod: t("categories.mod"),
    shader: t("categories.shader"),
    resourcepack: t("categories.resourcepack"),
    update: t("categories.update"),
  };

  const KIND_LABEL: Record<ContentRow["kind"], string> = {
    modrinth: t("kinds.modrinth"),
    curseforge: t("kinds.curseforge"),
    url: t("kinds.url"),
    override: t("kinds.override"),
    manual: t("kinds.manual"),
  };
  // Deleting a manual file is irreversible in a way removing a pack file is
  // not: the launcher never had a copy and cannot fetch it again. Pack files
  // keep the existing one-click behaviour.
  const [confirmDelete, setConfirmDelete] = useState<ContentRow | null>(null);
  // The row whose project page is open, IN the launcher. Held as the row
  // rather than the id so the modal can show its name from the first frame
  // instead of waiting for the fetch to name it.
  const [viewing, setViewing] = useState<ContentRow | null>(null);
  /** A disable or delete that something else needs, held until the player
   *  confirms. Carries the action so one dialog serves both. */
  const [confirmBreak, setConfirmBreak] = useState<{
    row: ContentRow;
    names: string[];
    action: "toggle" | "delete";
  } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ContentCategory>("all");
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);
  const [graph, setGraph] = useState<ModGraph | null>(null);

  // Keyed on the FILE SET, not on a reload counter. An update renames a jar —
  // the version is in the filename — so a graph read before it would annotate a
  // row that no longer exists and miss the one that replaced it. Row identity is
  // the path, so this re-reads exactly when the graph could have changed and not
  // on every unrelated re-render.
  const pathsKey = rows.map((r) => r.path).join("|");
  useEffect(() => {
    let live = true;
    void instanceModGraph(slug).then((g) => {
      if (live) setGraph(g);
    });
    return () => {
      live = false;
    };
  }, [slug, pathsKey]);

  const displayName = (path: string): string =>
    rows.find((r) => r.path === path)?.name ?? path.split("/").pop() ?? path;

  /** Files that would break without `path`, as display names where we have one.
   *  Falls back to the bare filename for a jar the content list does not carry
   *  (a nested or manual one). */
  const neededBy = (path: string): string[] =>
    (graph?.dependents[path] ?? []).map(displayName);

  /** The dependents that are ON and would break if `path` went away. Only
   *  enabled ones: warning about a mod that is already off would be a dialog
   *  the player has to dismiss to do something harmless. */
  const wouldBreak = (path: string): string[] =>
    (graph?.dependents[path] ?? [])
      .filter((p) => rows.find((r) => r.path === p)?.enabled !== false)
      .map(displayName);

  /** What is broken RIGHT NOW, keyed by the file that will fail to load. Read
   *  from the graph rather than derived here, so a break caused outside the app
   *  — a jar deleted by hand, an update that dropped a dependency — shows up the
   *  same as one caused by a toggle. */
  const brokenByPath = useMemo(() => {
    const map = new Map<
      string,
      { modId: string; reason: string; to: string }[]
    >();
    for (const b of graph?.broken ?? []) {
      map.set(b.from, [
        ...(map.get(b.from) ?? []),
        { modId: b.modId, reason: b.reason, to: b.to },
      ]);
    }
    return map;
  }, [graph]);
  // Paths currently being fetched by the add-a-mod shortcut. Lowercased,
  // because the rows carry the manifest's casing and the events carry the
  // instance's.
  const [downloading, setDownloading] = useState<Set<string>>(() => new Set());

  // Adding a mod downloads it in the background, so the rows this component
  // read a moment ago go stale one file at a time. Refetching per file would be
  // a Modrinth round trip per jar of a dependency closure, so completions are
  // coalesced into one reload shortly after the last of them.
  //
  // A finished file stays in `downloading` until that reload lands, rather than
  // being dropped the moment its event arrives: the row's `installed` still
  // reads false until the refetch, so clearing early would flash "sin instalar"
  // between the spinner and the truth — the exact badge this whole change is
  // about.
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read through refs so the subscription survives a re-render. `onChanged` is
  // `reloadPacks`, rebuilt on every render of the app provider; in the deps it
  // would tear the listener down and back up in a loop.
  const latest = useRef({ reload, onChanged, t });
  latest.current = { reload, onChanged, t };
  useEffect(() => {
    const stop = onContentFile((event) => {
      if (event.slug !== slug) return;
      const key = event.path.toLowerCase();
      if (event.state === "downloading") {
        setDownloading((prev) => new Set(prev).add(key));
        return;
      }
      if (event.state === "error") {
        setDownloading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.error(
          event.error ??
            latest.current.t("downloadError", { name: event.path }),
        );
      }
      if (settle.current) clearTimeout(settle.current);
      settle.current = setTimeout(() => {
        settle.current = null;
        setDownloading(new Set());
        latest.current.reload();
        latest.current.onChanged();
      }, 400);
    });
    return () => {
      stop();
      if (settle.current) clearTimeout(settle.current);
    };
  }, [slug]);

  const pendingUpdates = useMemo(() => rows.filter((r) => r.update), [rows]);
  const updateCount = pendingUpdates.length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (category === "update") return !!row.update;
        if (category !== "all" && categoryOf(row) !== category) return false;
        if (!needle) return true;
        return (
          row.name.toLowerCase().includes(needle) ||
          row.fileName.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }, [rows, query, category]);

  const checkUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const found = await findUpdates(rows, minecraft, loader);
      setRows(rows.map((r) => ({ ...r, update: found.get(r.path) })));
      toast.success(
        found.size === 0
          ? t("noUpdates")
          : t("updateAvailable", { count: found.size }),
      );
    } catch {
      toast.error(t("updateCheckError"));
    } finally {
      setCheckingUpdates(false);
    }
  };

  /** Repoint one entry at a different Modrinth version. Resolving gives us the
   *  new sha512 and size; without those the manifest entry would still verify
   *  against the OLD bytes and the install would fail on a hash mismatch. */
  const applyUpdate = async (row: ContentRow) => {
    if (!row.update || !row.projectId) return;
    const resolved = await getCatalog().resolve({
      kind: "modrinth",
      projectId: row.projectId,
      versionId: row.update.versionId,
    });
    if (!resolved)
      throw new Error(`No se pudo resolver ${row.update.fileName}`);
    const folder = row.path.slice(0, row.path.lastIndexOf("/") + 1);
    await replaceFile(slug, row.path, {
      path: `${folder}${resolved.fileName}`,
      sha512: resolved.sha512,
      fileSize: resolved.fileSize,
      source: resolved.source,
    });
  };

  const updateOne = async (row: ContentRow) => {
    setBusyPath(row.path);
    try {
      await applyUpdate(row);
      toast.success(t("updated", { name: row.name }));
      reload();
      onChanged();
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("updateError"));
    } finally {
      setBusyPath(null);
    }
  };

  /** Applies exactly the rows the player confirmed in the review dialog.
   *  Sequential, and one failure never abandons the rest: a bulk edit that
   *  stops halfway leaves the manifest in a state nobody asked for. */
  const applyChosen = async (chosen: ContentRow[]) => {
    if (chosen.length === 0) return;
    setUpdatingAll(true);
    let done = 0;
    const failed: string[] = [];
    try {
      for (const [index, row] of chosen.entries()) {
        setUpdateProgress(`${index + 1}/${chosen.length} · ${row.name}`);
        try {
          await applyUpdate(row);
          done += 1;
        } catch {
          failed.push(row.name);
        }
      }
      if (done > 0) toast.success(t("updateSuccess", { count: done }));
      if (failed.length > 0) {
        toast({
          tone: "warn",
          title: t("updateWarning"),
          msg: failed.join(", "),
        });
      }
      setReviewing(false);
      reload();
      onChanged();
    } finally {
      setUpdatingAll(false);
      setUpdateProgress(null);
    }
  };

  /** Ask first when switching something OFF that other enabled mods need.
   *  Switching ON never breaks anything, so it is never interrupted. */
  const requestToggle = (row: ContentRow) => {
    const names = row.enabled ? wouldBreak(row.path) : [];
    if (names.length > 0) {
      setConfirmBreak({ row, names, action: "toggle" });
      return;
    }
    void toggle(row);
  };

  const requestRemove = (row: ContentRow) => {
    const names = wouldBreak(row.path);
    if (names.length > 0) {
      setConfirmBreak({ row, names, action: "delete" });
      return;
    }
    if (row.manual) setConfirmDelete(row);
    else void remove(row);
  };

  const toggle = async (row: ContentRow) => {
    setBusyPath(row.path);
    // Optimistic: the rename is instant and a round trip here makes the switch
    // feel broken.
    setRows(
      rows.map((r) =>
        r.path === row.path ? { ...r, enabled: !r.enabled } : r,
      ),
    );
    try {
      // A manual file has no marker entry and no optional-state to record, so
      // the rename on disk is the whole operation. `instanceOptionalSet` would
      // write an intent for a file no install plan will ever read.
      if (row.manual) {
        await instanceExtraSetEnabled(slug, row.path, !row.enabled);
      } else {
        await instanceOptionalSet(slug, row.path, !row.enabled);
      }
      onChanged();
    } catch (err) {
      setRows(
        rows.map((r) =>
          r.path === row.path ? { ...r, enabled: row.enabled } : r,
        ),
      );
      toast.error((err as { message?: string })?.message ?? t("toggleError"));
    } finally {
      setBusyPath(null);
    }
  };

  const remove = async (row: ContentRow) => {
    setBusyPath(row.path);
    try {
      // Two different operations behind one button. Removing a PACK file edits
      // the manifest and leaves the bytes for the next install pass to sweep;
      // removing a MANUAL file deletes it off disk, because nothing else ever
      // will — the sweep deliberately ignores files it does not own.
      if (row.manual) {
        await instanceExtraDelete(slug, row.path);
      } else {
        await removeFile(slug, row.path);
      }
      toast.success(t("removed", { name: row.name }));
      reload();
      onChanged();
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("removeError"));
    } finally {
      setBusyPath(null);
    }
  };

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("loading")}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The project page, in the launcher. Keyed on the path so switching
          rows remounts rather than showing the previous mod's body while the
          new fetch lands. */}
      {viewing?.projectId && (
        <ProjectModal
          key={viewing.path}
          t={t}
          platform={viewing.kind === "curseforge" ? "curseforge" : "modrinth"}
          projectId={viewing.projectId}
          fallbackName={viewing.name}
          onClose={() => setViewing(null)}
        />
      )}

      <UpdateReview
        open={reviewing}
        rows={pendingUpdates}
        busy={updatingAll}
        progress={updateProgress}
        onCancel={() => setReviewing(false)}
        onConfirm={(chosen) => void applyChosen(chosen)}
      />

      {/* Only manual files reach this. Removing a pack file is recoverable —
          the manifest still describes it and a repair fetches it again — so it
          keeps its one-click behaviour. Deleting a file the player supplied is
          the one action here the launcher cannot undo. */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t("deleteFileTitle")}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-txt-muted">
            {t("deleteFileWarning", { name: confirmDelete?.name ?? "" })}
          </p>
          <p className="font-mono text-xs text-txt-dim">
            {confirmDelete?.path}
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmDelete(null)}>
              {t("cancelButton")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon="trash"
              loading={busyPath === confirmDelete?.path}
              onClick={() => {
                const row = confirmDelete;
                setConfirmDelete(null);
                if (row) void remove(row);
              }}
            >
              {t("deleteButton")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* One dialog for both actions: the question is identical — "this breaks
          these mods, still?" — and only the verb on the button differs. It never
          opens for a switch-ON, which cannot break anything. */}
      <Modal
        open={confirmBreak !== null}
        onClose={() => setConfirmBreak(null)}
        title={t("breakTitle")}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-txt-muted">
            {t("breakWarning", {
              name: confirmBreak?.row.name ?? "",
              names: confirmBreak?.names.join(", ") ?? "",
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmBreak(null)}>
              {t("cancelButton")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                const pending = confirmBreak;
                setConfirmBreak(null);
                if (!pending) return;
                if (pending.action === "toggle") void toggle(pending.row);
                // A manual file still gets its own irreversible-delete
                // confirmation afterwards; this dialog answers a different
                // question and must not stand in for that one.
                else if (pending.row.manual) setConfirmDelete(pending.row);
                else void remove(pending.row);
              }}
            >
              {confirmBreak?.action === "delete"
                ? t("deleteButton")
                : t("breakConfirm")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* However it got this way. The badge alone reaches only a player who
          scrolls to that row, and a pack that will not start is worth saying
          once at the top. */}
      {brokenByPath.size > 0 && (
        <Banner tone="error">
          {t("brokenBanner", { count: brokenByPath.size })}
        </Banner>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search", { count: rows.length })}
          />
        </div>
        {isLocal && (
          <Button size="sm" variant="pri" icon="plus" onClick={onBrowse}>
            {t("addContent")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Seg
          value={category}
          onChange={(v) => setCategory(v as ContentCategory)}
          options={[
            { value: "all", label: t("everything") },
            { value: "mod", label: CATEGORY_LABEL.mod },
            { value: "shader", label: CATEGORY_LABEL.shader },
            { value: "resourcepack", label: CATEGORY_LABEL.resourcepack },
            ...(updateCount > 0
              ? [
                  {
                    value: "update",
                    label: `${CATEGORY_LABEL.update} (${updateCount})`,
                  },
                ]
              : []),
          ]}
        />
        <span className="flex-1" />
        {/* Update checking is a local-pack action: a managed pack's versions
            are the server's to pick, and an update the player cannot take is
            just a badge that never goes away. */}
        {isLocal && (
          <>
            {updateCount > 0 && (
              <Button
                size="sm"
                icon="download"
                disabled={updatingAll || busyPath !== null}
                onClick={() => setReviewing(true)}
              >
                {t("reviewUpdates", { count: updateCount })}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon="refresh"
              loading={checkingUpdates}
              disabled={checkingUpdates}
              onClick={() => void checkUpdates()}
            >
              {t("checkUpdates")}
            </Button>
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <Empty
          icon="cube"
          title={t("nothingToShow")}
          lead={
            rows.length === 0
              ? isLocal
                ? t("emptyLocal")
                : t("emptyManaged")
              : t("nothingMatches")
          }
        >
          {isLocal && rows.length === 0 && (
            <Button size="sm" variant="pri" icon="plus" onClick={onBrowse}>
              {t("addContent")}
            </Button>
          )}
        </Empty>
      ) : (
        <ul className="flex flex-col">
          {/* A table element would give even columns; these rows need the name
              to absorb all the slack while the actions stay pinned right. */}
          <li className="flex items-center gap-3 border-b border-solid border-line px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            <span className="w-10 shrink-0" />
            <span className="min-w-0 flex-1">Proyecto</span>
            <span className="hidden w-[200px] shrink-0 md:block">Versión</span>
            <span className="w-[140px] shrink-0 text-right">Acciones</span>
          </li>
          {visible.map((row) => {
            const busy = busyPath === row.path;
            // Null for a hand-dropped jar, an `override` blob or a bare URL —
            // those have no project page, so the row stays inert rather than
            // offering a link that goes nowhere.
            const link = projectUrl(row.kind, row.projectId);
            const open = () => {
              if (link) setViewing(row);
            };
            return (
              <li
                key={row.path}
                className={cn(
                  "flex items-center gap-3 border-b border-solid border-line px-3 py-2 hover:bg-panel-2",
                  link && "cursor-pointer",
                )}
                // `button`, not `link`: this opens a panel inside the app, it
                // does not navigate anywhere. Keyboard users need the role and
                // the keys explicitly — an <li> gives them neither.
                {...(link
                  ? {
                      role: "button",
                      tabIndex: 0,
                      title: row.name,
                      onClick: open,
                      onKeyDown: (event: KeyboardEvent) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          open();
                        }
                      },
                    }
                  : {})}
              >
                <CatalogIcon src={row.iconUrl} size={40} />

                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-display text-[14px] font-bold uppercase tracking-[0.03em]">
                      {row.name}
                    </span>
                    {/* `new`, matching the browser's Fabric marker: a mod the
                        pack only runs because of Connector should look the same
                        wherever it is listed. */}
                    {row.manual && (
                      <Badge tone="warn" className="shrink-0">
                        {t("manualBadge")}
                      </Badge>
                    )}
                    {row.loader === "fabric" && (
                      <Badge tone="new" className="shrink-0">
                        {t("loaderFabric")}
                      </Badge>
                    )}
                    {row.update && (
                      <Badge tone="info" className="shrink-0">
                        {t("updateBadge")}
                      </Badge>
                    )}
                    {!row.enabled && (
                      <Badge tone="warn" className="shrink-0">
                        {t("disabledBadge")}
                      </Badge>
                    )}
                    {/* `bad`, not `warn`: this mod will not load at all. Every
                        other badge on this row describes a state the player
                        chose; this one describes one they probably did not. */}
                    {brokenByPath.has(row.path) && (
                      <Badge tone="bad" className="shrink-0">
                        {t("brokenBadge")}
                      </Badge>
                    )}
                    {/* Downloading wins over "sin instalar": both are true
                        while a just-added mod is in flight, and only one of
                        them tells the player something is happening. */}
                    {downloading.has(row.path.toLowerCase()) ? (
                      <Badge
                        tone="info"
                        className="flex shrink-0 items-center gap-1"
                      >
                        <Spinner size={9} /> {t("downloadingBadge")}
                      </Badge>
                    ) : (
                      !row.installed && (
                        <Badge tone="warn" className="shrink-0">
                          {t("notInstalledBadge")}
                        </Badge>
                      )
                    )}
                  </span>
                  <span className="truncate font-mono text-[12px] text-txt-dim">
                    {row.author ? `${row.author} · ` : ""}
                    {KIND_LABEL[row.kind]} · {formatBytes(row.size)}
                  </span>
                  {/* The answer to "why is Cloth Config in my pack, and what
                      happens if I delete it?" — asked on the row that carries
                      the delete button, which is the only place it gets asked.
                      Read off the jars, because nothing in the manifest knows. */}
                  {neededBy(row.path).length > 0 && (
                    <span className="truncate text-[11px] leading-snug text-txt-dim">
                      {t("neededBy", { names: neededBy(row.path).join(", ") })}
                    </span>
                  )}
                  {/* Names the missing mod, and says whether it is off or gone —
                      the two need different fixes, so one word for both would
                      send half the players looking in the wrong place. */}
                  {brokenByPath.get(row.path)?.map((b) => (
                    <span
                      key={b.modId}
                      className="truncate text-[11px] leading-snug text-bad"
                    >
                      {b.reason === "disabled"
                        ? t("brokenDisabled", {
                            name: displayName(b.to),
                            modId: b.modId,
                          })
                        : t("brokenMissing", { modId: b.modId })}
                    </span>
                  ))}
                </span>

                {/* Sized to its content instead of a fixed 200px: a jar filename
                    carries the version, which is the one thing this column
                    exists to show, and `moreculling-neoforge-1.21.1-1.0.6.jar`
                    is longer than that. `shrink-0` makes the flexible name
                    column give way first — it truncates gracefully, this does
                    not. Capped so a pathological name cannot eat the row. */}
                <span className="hidden max-w-[440px] shrink-0 flex-col gap-[2px] md:flex">
                  <span className="whitespace-nowrap font-mono text-[12px] text-txt-muted">
                    {row.fileName}
                  </span>
                  {row.update && (
                    <span className="whitespace-nowrap font-mono text-[11px] text-accent-bright">
                      → {row.update.label}
                    </span>
                  )}
                </span>

                {/* Stops the row's link from firing behind every action: the
                    toggle, update and delete controls all live inside the
                    clickable row, and a delete that also opens Modrinth is
                    not what anyone pressed. */}
                <span
                  className="flex w-[140px] shrink-0 items-center justify-end gap-1"
                  onClick={(event) => event.stopPropagation()}
                >
                  {busy ? (
                    <Spinner size={14} className="text-txt-muted" />
                  ) : (
                    <>
                      {isLocal && row.update && (
                        <button
                          type="button"
                          aria-label={`Actualizar ${row.name}`}
                          title="Actualizar"
                          onClick={() => void updateOne(row)}
                          className="p-1 text-accent-bright hover:text-txt"
                        >
                          <Icon name="download" size={15} />
                        </button>
                      )}
                      {/* Managed packs allow the toggle only where the manifest
                          declares the file optional; local packs own every file
                          and may switch any of them off. */}
                      {/* A manual file is the player's own, so it is toggleable
                          and deletable in a MANAGED pack too — the restriction
                          exists to protect the pack's files, and these are not
                          the pack's. */}
                      {(isLocal || row.optional || row.manual) && (
                        <Toggle
                          on={row.enabled}
                          onChange={() => requestToggle(row)}
                          ariaLabel={t("toggleFileLabel", { name: row.name })}
                        />
                      )}
                      {(isLocal || row.manual) && (
                        <button
                          type="button"
                          aria-label={`${t("deleteAction")} ${row.name}`}
                          title={
                            row.manual
                              ? t("deleteFileTitle")
                              : t("deletePackFileTitle")
                          }
                          onClick={() => requestRemove(row)}
                          className="p-1 text-txt-dim hover:text-bad"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
