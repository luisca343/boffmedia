"use client";

/**
 * The Teams tab: the list, or — when the address carries `team` — the editor.
 *
 * Route-driven on purpose. The editor used to be entered through component
 * state, so it had no address, Back left the tool and a reload lost it. Now
 * `?tab=equipos&team=<id>` IS the editor, `slot` the selected set, and this
 * component only decides which of the two to draw.
 */

import * as React from "react";
import { exportPaste, getFormat, unpackTeam, type TeamRecord } from "@boffmedia/battle-core";
import { Button, ConfirmDialog, DISPLAY_VOICE, IconButton, cn, toast } from "@boffmedia/ui";
import { DkEmpty, DkSearch, DkSelect, DkSkel } from "@boffmedia/ui/datakit";

import { BsimErrorState, BSIM_PAGE, BSIM_STATE } from "../components/bsim-kit";
import { useToolT } from "../i18n";
import { BSIM_TEAM_FORMATS } from "../lib/bsim-data";
import { useBsimNav } from "../nav";
import { ImportPasteModal } from "./ImportPasteModal";
import { TB_NS } from "./labels";
import { TbKicker } from "./tb-kit";
import { TeamCard } from "./TeamCard";
import { TeamEditor } from "./TeamEditor";
import { useTeams } from "./useTeams";
import type { LibraryTeam } from "./library-types";

const OTHER = "__other";
const ALL = "all";
const FAVORITES = "favorites";
const PINNED = "pinned";

const GRID = "grid gap-[0.875rem] grid-cols-1 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-4 min-[2240px]:grid-cols-5";

export function TeamsView() {
  const t = useToolT(TB_NS);
  const nav = useBsimNav();
  const teams = useTeams();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState(ALL);
  const [libraryFilter, setLibraryFilter] = React.useState(ALL);
  const [sort, setSort] = React.useState("updated");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFormat, setImportFormat] = React.useState(BSIM_TEAM_FORMATS[0]?.value ?? "gen9ou");
  const [pendingDelete, setPendingDelete] = React.useState<TeamRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const toList = React.useCallback(() => nav.replace("hub", { tab: "equipos" }), [nav]);
  const openEditor = React.useCallback((clientId: string) => nav.push("hub", { ...nav.params, tab: "equipos", team: clientId }), [nav]);
  const playWith = (team: TeamRecord) => nav.push("play", { format: team.format, team: team.clientId });

  const formatLabel = React.useCallback((id: string) => getFormat(id)?.label ?? id, []);

  /* ── Grouping ──────────────────────────────────────────────────────────── */
  const known = React.useMemo(() => new Set(BSIM_TEAM_FORMATS.map((f) => f.value)), []);

  // Collect all available tags from teams.
  const availableTags = React.useMemo(() => {
    const tags = new Set<string>();
    for (const team of teams.teams) {
      if (team.tags) {
        for (const tag of team.tags) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).sort();
  }, [teams.teams]);

  const tagCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of teams.teams) {
      for (const tag of team.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return counts;
  }, [teams.teams]);

  const searchableText = React.useCallback((team: LibraryTeam) => {
    const values = [team.name, ...(team.tags ?? []), team.notes ?? ""];
    try {
      const sets = team.packed ? unpackTeam(team.packed) : null;
      for (const set of sets ?? []) values.push(set.species, set.item, set.ability, ...(set.moves ?? []));
    } catch {
      // A malformed saved row should still be searchable by its name/tags.
    }
    return values.filter(Boolean).join(" ").toLowerCase();
  }, []);

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFormat = new Map<string, LibraryTeam[]>();
    const filtered = teams.teams.filter((team) => {
      if (q && !searchableText(team).includes(q)) return false;
      if (libraryFilter === FAVORITES && !team.favorite) return false;
      if (libraryFilter === PINNED && !team.pinned) return false;
      if (libraryFilter.startsWith("tag:") && !(team.tags ?? []).includes(libraryFilter.slice(4))) return false;
      const key = known.has(team.format) ? team.format : OTHER;
      if (filter !== ALL && key !== filter) return false;
      return true;
    }).slice().sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(b.pinned) - Number(a.pinned);
      if (Boolean(b.favorite) !== Boolean(a.favorite)) return Number(b.favorite) - Number(a.favorite);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "format") return formatLabel(a.format).localeCompare(formatLabel(b.format)) || b.updatedAt - a.updatedAt;
      return b.updatedAt - a.updatedAt;
    });
    for (const team of filtered) {
      const key = known.has(team.format) ? team.format : OTHER;
      const list = byFormat.get(key) ?? [];
      list.push(team);
      byFormat.set(key, list);
    }
    const ordered: { key: string; label: string; teams: LibraryTeam[] }[] = [];
    for (const f of BSIM_TEAM_FORMATS) {
      const list = byFormat.get(f.value);
      if (list?.length) ordered.push({ key: f.value, label: f.label, teams: list });
    }
    const other = byFormat.get(OTHER);
    if (other?.length) ordered.push({ key: OTHER, label: t("otherFormats"), teams: other });
    return ordered;
  }, [teams.teams, query, filter, libraryFilter, sort, known, searchableText, formatLabel, t]);

  const filterOptions = React.useMemo(() => {
    const present = new Set(teams.teams.map((tm) => (known.has(tm.format) ? tm.format : OTHER)));
    const opts = [{ value: ALL, label: t("filterAll") }];
    for (const f of BSIM_TEAM_FORMATS) if (present.has(f.value)) opts.push({ value: f.value, label: f.label });
    if (present.has(OTHER)) opts.push({ value: OTHER, label: t("otherFormats") });
    return opts;
  }, [teams.teams, known, t]);

  React.useEffect(() => {
    if (filter !== ALL && !filterOptions.some((o) => o.value === filter)) setFilter(ALL);
  }, [filter, filterOptions]);

  React.useEffect(() => {
    if (!libraryFilter.startsWith("tag:")) return;
    if (!availableTags.includes(libraryFilter.slice(4))) setLibraryFilter(ALL);
  }, [libraryFilter, availableTags]);

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const create = async () => {
    const format = filter !== ALL && filter !== OTHER ? filter : importFormat;
    const record = await teams.create(t("newTeamName"), format);
    openEditor(record.clientId);
  };

  const duplicate = async (team: TeamRecord) => {
    const copy = await teams.duplicate(team.clientId);
    if (copy) toast.success(t("toast.duplicated"));
  };

  const exportTeam = async (team: TeamRecord) => {
    try {
      await navigator.clipboard.writeText(teams.toPaste(team));
      toast.success(t("toast.exported"));
    } catch {
      toast.error(t("toast.exportFailed"));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const removed = await teams.remove(pendingDelete.clientId);
      setPendingDelete(null);
      if (removed) {
        toast({
          msg: t("toast.deleted"),
          tone: "info",
          icon: "trash",
          duration: 6500,
          action: {
            label: t("toast.undo"),
            onClick: () => {
              void teams.restore(removed).then(() => toast.success(t("toast.restored")));
            },
          },
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const addTag = async (team: TeamRecord, tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    const current = team.tags ?? [];
    if (!current.includes(trimmed)) {
      await teams.update(team.clientId, { tags: [...current, trimmed] });
    }
  };

  const removeTag = async (team: TeamRecord, tag: string) => {
    const current = team.tags ?? [];
    const updated = current.filter((t) => t !== tag);
    await teams.update(team.clientId, { tags: updated });
  };

  React.useEffect(() => {
    if (nav.params.team) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("input[placeholder]")?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        void create();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /* ── Editor route ──────────────────────────────────────────────────────── */
  const openId = nav.params.team;
  if (openId) {
    if (teams.loading) return <DkSkel h={420} />;
    const team = teams.teams.find((tm) => tm.clientId === openId);
    if (!team) {
      return (
        <BsimErrorState
          code="not_found"
          actions={
            <Button size="sm" icon="back" onClick={toList}>
              {t("backToList")}
            </Button>
          }
        />
      );
    }
    return (
      <TeamEditor
        key={team.clientId}
        team={team}
        onSaveLocal={(patch) => teams.updateLocal(team.clientId, patch)}
        onSync={() => teams.syncTeam(team.clientId)}
        onMetaChange={(patch) => teams.update(team.clientId, patch)}
        onTagsChange={(tags) => teams.update(team.clientId, { tags })}
        onBackToList={toList}
      />
    );
  }

  /* ── List ──────────────────────────────────────────────────────────────── */
  const importFields = (
    <div className="grid gap-[0.4375rem]">
      <TbKicker>{t("formatLabel")}</TbKicker>
      <DkSelect value={importFormat} onChange={setImportFormat} ariaLabel={t("formatLabel")} options={BSIM_TEAM_FORMATS.map((f) => ({ value: f.value, label: f.label }))} className="max-w-none" />
    </div>
  );

  const importModal = (
    <ImportPasteModal
      open={importOpen}
      onClose={() => setImportOpen(false)}
      fields={importFields}
      onImport={async (sets) => {
        const paste = exportPaste(sets);
        const record = await teams.importFromPaste(t("importedName"), importFormat, paste);
        if (record) toast.success(t("toast.imported"));
      }}
    />
  );

  if (teams.loading) {
    return (
      <div className={cn(BSIM_PAGE, GRID)} aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <DkSkel key={i} h={176} />
        ))}
      </div>
    );
  }

  if (teams.teams.length === 0) {
    return (
      <>
        <DkEmpty icon="layers" title={t("empty.title")} lead={t("empty.lead")} className={BSIM_STATE}>
          <div className="grid w-full max-w-[20rem] gap-3 text-left">
            <div className="grid gap-[0.4375rem]">
              <TbKicker>{t("formatLabel")}</TbKicker>
              <DkSelect value={importFormat} onChange={setImportFormat} ariaLabel={t("formatLabel")} options={BSIM_TEAM_FORMATS.map((f) => ({ value: f.value, label: f.label }))} className="max-w-none" />
            </div>
            {/* Secondary then primary — the same order the populated list's
                header uses, so the pair does not swap places under the cursor
                the moment the first team exists. */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button icon="upload" onClick={() => setImportOpen(true)}>
                {t("import")}
              </Button>
              <Button variant="pri" icon="plus" onClick={() => void create()}>
                {t("new")}
              </Button>
            </div>
          </div>
        </DkEmpty>
        {importModal}
      </>
    );
  }

  return (
    <div className={cn(BSIM_PAGE, "grid content-start gap-5")}>
      <div className="grid gap-3 min-[900px]:grid-cols-[13rem_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-5">
      <aside className="grid content-start gap-2 border border-solid border-line bg-panel p-3 min-[900px]:sticky min-[900px]:top-[calc(var(--tool-sticky-top,0px)+var(--tool-bar-h,3.625rem))]">
        <TbKicker>{t("library.title")}</TbKicker>
        <div className="grid gap-1">
          {[
            { id: ALL, icon: "layers" as const, label: t("library.all") },
            { id: FAVORITES, icon: "star" as const, label: t("library.favorites") },
            { id: PINNED, icon: "bookmark" as const, label: t("library.pinned") },
          ].map((item) => (
            <Button key={item.id} size="sm" variant={libraryFilter === item.id ? "pri" : "ghost"} icon={item.icon} onClick={() => setLibraryFilter(item.id)} className="justify-start">
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-2 grid gap-1 border-t border-solid border-line pt-3">
          <TbKicker className="px-2">{t("tags.title")}</TbKicker>
          {availableTags.length === 0 ? (
            <p className="m-0 px-2 py-1 font-body text-[0.75rem] text-txt-dim">{t("tags.empty")}</p>
          ) : availableTags.map((tag) => (
            <Button key={tag} size="sm" variant={libraryFilter === `tag:${tag}` ? "pri" : "ghost"} icon="filter" onClick={() => setLibraryFilter(`tag:${tag}`)} className="justify-start truncate">
              <span className="min-w-0 truncate">{tag}</span>
              <span className="font-mono text-[0.625rem] tabular-nums text-txt-dim">{tagCounts.get(tag)}</span>
            </Button>
          ))}
        </div>
      </aside>
      <div className="grid min-w-0 content-start gap-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className={cn(DISPLAY_VOICE, "m-0 text-[clamp(1.375rem,3vw,1.875rem)] text-txt")}>{t("title")}</h2>
          <span className="font-mono text-[0.6875rem]/none tabular-nums text-txt-dim">{t("count", { count: teams.teams.length })}</span>
        </div>
        <span className="flex-1" />
        <DkSearch value={query} onChange={setQuery} placeholder={t("searchPh")} className="w-[13.75rem] max-[600px]:w-full" />
        <DkSelect value={filter} onChange={setFilter} options={filterOptions} ariaLabel={t("filterAria")} className="w-[12rem] max-w-full" />
        <DkSelect value={sort} onChange={setSort} ariaLabel={t("sort.label")} options={[{ value: "updated", label: t("sort.updated") }, { value: "name", label: t("sort.name") }, { value: "format", label: t("sort.format") }]} />
        <div className="flex items-center gap-1">
          <IconButton size="sm" name="grid" variant={viewMode === "grid" ? "pri" : "ghost"} label={t("view.grid")} onClick={() => setViewMode("grid")} />
          <IconButton size="sm" name="list" variant={viewMode === "list" ? "pri" : "ghost"} label={t("view.list")} onClick={() => setViewMode("list")} />
        </div>
        <Button size="sm" icon="upload" onClick={() => setImportOpen(true)}>
          {t("import")}
        </Button>
        <Button size="sm" variant="pri" icon="plus" onClick={() => void create()}>
          {t("new")}
        </Button>
      </header>
      <p className="m-0 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{t("meta.shortcuts")}</p>

      {groups.length === 0 ? (
        <DkEmpty icon="search" title={t("noMatch")} lead={t("noMatchLead")} className={BSIM_STATE}>
          <Button size="sm" icon="x" onClick={() => { setQuery(""); setFilter(ALL); setLibraryFilter(ALL); }}>
            {t("clearFilters")}
          </Button>
        </DkEmpty>
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-label={group.label} className="grid gap-3">
            <div className="flex items-center gap-3">
              <TbKicker className="text-txt-muted">{group.label}</TbKicker>
              <span className="font-mono text-[0.625rem]/none tabular-nums text-txt-dim">{group.teams.length}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className={viewMode === "grid" ? GRID : "grid gap-2"}>
              {group.teams.map((team) => (
                <TeamCard
                  key={team.clientId}
                  team={team}
                  viewMode={viewMode}
                  onPlay={() => playWith(team)}
                  onEdit={() => openEditor(team.clientId)}
                  onDuplicate={() => void duplicate(team)}
                  onRename={(name) => void teams.update(team.clientId, { name })}
                  onExport={() => void exportTeam(team)}
                  onDelete={() => setPendingDelete(team)}
                  onAddTag={(tag) => void addTag(team, tag)}
                  onRemoveTag={(tag) => void removeTag(team, tag)}
                  onToggleFavorite={() => void teams.update(team.clientId, { favorite: !team.favorite })}
                  onTogglePinned={() => void teams.update(team.clientId, { pinned: !team.pinned })}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="error"
        title={t("deleteDialog.title")}
        body={t("deleteDialog.body", { name: pendingDelete?.name ?? "" })}
        confirmLabel={t("deleteDialog.confirm")}
        cancelLabel={t("cancel")}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />

      {importModal}
    </div>
    </div>
    </div>
  );
}
