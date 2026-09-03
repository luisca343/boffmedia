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
import { exportPaste, getFormat, type TeamRecord } from "@boffmedia/battle-core";
import { Button, ConfirmDialog, DISPLAY_VOICE, cn, toast } from "@boffmedia/ui";
import { DkEmpty, DkSearch, DkSeg, DkSelect, DkSkel, useDkNarrow } from "@boffmedia/ui/datakit";

import { BsimErrorState, BSIM_PAGE, BSIM_SEG_FOCUS, BSIM_STATE } from "../components/bsim-kit";
import { useToolT } from "../i18n";
import { BSIM_TEAM_FORMATS } from "../lib/bsim-data";
import { useBsimNav } from "../nav";
import { ImportPasteModal } from "./ImportPasteModal";
import { TB_NS } from "./labels";
import { TbKicker } from "./tb-kit";
import { TeamCard } from "./TeamCard";
import { TeamEditor } from "./TeamEditor";
import { useTeams } from "./useTeams";

const OTHER = "__other";
const ALL = "all";

const GRID = "grid gap-[0.875rem] grid-cols-1 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-4 min-[2240px]:grid-cols-5";

export function TeamsView() {
  const t = useToolT(TB_NS);
  const nav = useBsimNav();
  const teams = useTeams();
  const narrow = useDkNarrow(900);

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState(ALL);
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
  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFormat = new Map<string, TeamRecord[]>();
    for (const team of teams.teams) {
      if (q && !team.name.toLowerCase().includes(q)) continue;
      const key = known.has(team.format) ? team.format : OTHER;
      if (filter !== ALL && key !== filter) continue;
      const list = byFormat.get(key) ?? [];
      list.push(team);
      byFormat.set(key, list);
    }
    const ordered: { key: string; label: string; teams: TeamRecord[] }[] = [];
    for (const f of BSIM_TEAM_FORMATS) {
      const list = byFormat.get(f.value);
      if (list?.length) ordered.push({ key: f.value, label: f.label, teams: list });
    }
    const other = byFormat.get(OTHER);
    if (other?.length) ordered.push({ key: OTHER, label: t("otherFormats"), teams: other });
    return ordered;
  }, [teams.teams, query, filter, known, t]);

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
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className={cn(DISPLAY_VOICE, "m-0 text-[clamp(1.375rem,3vw,1.875rem)] text-txt")}>{t("title")}</h2>
          <span className="font-mono text-[0.6875rem]/none tabular-nums text-txt-dim">{t("count", { count: teams.teams.length })}</span>
        </div>
        <span className="flex-1" />
        <DkSearch value={query} onChange={setQuery} placeholder={t("searchPh")} className="w-[13.75rem] max-[600px]:w-full" />
        {narrow || filterOptions.length > 5 ? (
          <DkSelect value={filter} onChange={setFilter} options={filterOptions} ariaLabel={t("filterAria")} />
        ) : (
          <DkSeg value={filter} onChange={setFilter} options={filterOptions} ariaLabel={t("filterAria")} className={BSIM_SEG_FOCUS} />
        )}
        <Button size="sm" icon="upload" onClick={() => setImportOpen(true)}>
          {t("import")}
        </Button>
        <Button size="sm" variant="pri" icon="plus" onClick={() => void create()}>
          {t("new")}
        </Button>
      </header>

      {groups.length === 0 ? (
        <DkEmpty icon="search" title={t("noMatch")} lead={t("noMatchLead")} className={BSIM_STATE}>
          <Button size="sm" icon="x" onClick={() => { setQuery(""); setFilter(ALL); }}>
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
            <div className={GRID}>
              {group.teams.map((team) => (
                <TeamCard
                  key={team.clientId}
                  team={team}
                  formatLabel={formatLabel(team.format)}
                  onPlay={() => playWith(team)}
                  onEdit={() => openEditor(team.clientId)}
                  onDuplicate={() => void duplicate(team)}
                  onRename={(name) => void teams.update(team.clientId, { name })}
                  onExport={() => void exportTeam(team)}
                  onDelete={() => setPendingDelete(team)}
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
  );
}
