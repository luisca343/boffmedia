"use client";

/**
 * The team editor: header (back · name · status · format · actions), then the panes.
 *
 *   ≥1280   rail 280px · set editor · validity + coverage 300px
 *   901–1279 rail 280px · set editor (validity + coverage in a Disclosure above)
 *   ≤900    six-chip strip pinned under the bar · set editor below
 *   ≤480    the strip becomes a 3×2 sprite grid
 *
 * The open team and the selected slot live in the address (`team`, `slot`),
 * so Back, reload and a shared link all land on the same set.
 *
 * THERE IS NO SAVE BUTTON. Every change is written to the tool store on a
 * ~300 ms debounce (see `useTeamDraft`), so a closed tab, a reload or a crash
 * costs nothing and Back never has to ask. What the header shows instead is
 * where the work IS — on this device, in the queue, or on the account — plus
 * a Sincronizar action for pushing it to the account without waiting for the
 * idle timer. Legality never gates any of it (D12).
 */

import * as React from "react";
import { exportPaste, type TeamRecord } from "@boffmedia/battle-core";
import { Banner, Button, Disclosure, DISPLAY_VOICE, Icon, Input, Menu, cn, toast } from "@boffmedia/ui";
import { DkBack, DkSelect, useDkNarrow } from "@boffmedia/ui/datakit";

import { BsimSection, BSIM_FOCUS } from "../components/bsim-kit";
import type { TeamSyncResult } from "../sync";
import { useToolT } from "../i18n";
import { BSIM_TEAM_FORMATS } from "../lib/bsim-data";
import { useBsimNav } from "../nav";
import { ImportPasteModal } from "./ImportPasteModal";
import { TB_NS, useTbLabels } from "./labels";
import { isEmptySet } from "./set-defaults";
import { SetEditor } from "./SetEditor";
import { analyseTeam } from "./teamAnalysis";
import { TbIconAction, TbKicker, TbSlotChip, TbSlotRow, TbSyncChip, TbTypeChip, TbValidityChip, type TbSlotMon, type TbValidity } from "./tb-kit";
import { useTeamDraft } from "./useTeamDraft";
import { useTeamValidation } from "./useTeamValidation";
import { Dex } from "@pkmn/dex";

export interface TeamEditorProps {
  team: TeamRecord;
  /** TIER 1 — the local write. Called on every debounced change. */
  onSaveLocal: (patch: Pick<TeamRecord, "name" | "format" | "packed">) => Promise<void>;
  /** TIER 2 — queue this team for the account and flush, reporting what happened. */
  onSync: () => Promise<TeamSyncResult>;
  onBackToList: () => void;
}

const clampSlot = (raw: string | undefined) => {
  const n = parseInt(raw ?? "", 10);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(5, n));
};

export function TeamEditor({ team, onSaveLocal, onSync, onBackToList }: TeamEditorProps) {
  const t = useToolT(TB_NS);
  const labels = useTbLabels();
  const nav = useBsimNav();
  // Rebuilt every render on purpose: the hook keeps it in a ref, so a fresh
  // object costs nothing and neither half can go stale.
  const draft = useTeamDraft(team, { saveLocal: onSaveLocal, sync: onSync });
  const validation = useTeamValidation(draft.format, draft.packed);
  const twoPane = useDkNarrow(1279);
  const strip = useDkNarrow(900);
  const tiny = useDkNarrow(480);
  // Below ~600px the host bar wraps onto two rows, and its height is no longer
  // `--tool-bar-h`; a strip pinned under that value slides beneath the bar.
  // There is no token for the wrapped height, so the strip scrolls instead.
  const pinStrip = !useDkNarrow(600);

  const slot = clampSlot(nav.params.slot);
  const selectSlot = (i: number) => nav.replace("hub", { ...nav.params, tab: "equipos", slot: String(i) });

  const [importOpen, setImportOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(draft.name);

  const formatOptions = React.useMemo(() => {
    const opts = BSIM_TEAM_FORMATS.map((f) => ({ value: f.value, label: f.label }));
    if (!opts.some((o) => o.value === draft.format)) opts.unshift({ value: draft.format, label: draft.format });
    return opts;
  }, [draft.format]);

  /* ── Actions ───────────────────────────────────────────────────────────── */
  // Nothing to confirm: the store already has everything, and unmounting this
  // editor is itself one of the upload triggers.
  const leave = () => onBackToList();

  // The battle reads the team back out of the store, so the debounced write has
  // to have landed before the screen changes.
  const play = async () => {
    await draft.flushLocal();
    nav.push("play", { format: draft.format, team: team.clientId });
  };

  const doExport = async () => {
    const paste = exportPaste(draft.sets.filter((s) => !isEmptySet(s)));
    try {
      await navigator.clipboard.writeText(paste);
      toast.success(t("toast.exported"));
    } catch {
      toast.error(t("toast.exportFailed"));
    }
  };

  const startRename = () => {
    setNameDraft(draft.name);
    setRenaming(true);
  };
  const commitRename = () => {
    const next = nameDraft.trim();
    if (next) draft.setName(next);
    setRenaming(false);
  };

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const problems = React.useMemo(
    () =>
      validation.problems.map((text) => {
        const at = draft.sets.findIndex((s) => s.species && (text.includes(s.species) || (s.name && text.includes(s.name))));
        return { text, slot: at === -1 ? null : at };
      }),
    [validation.problems, draft.sets],
  );
  const flagged = React.useMemo(() => new Set(problems.map((p) => p.slot).filter((s): s is number => s !== null)), [problems]);
  const analysis = React.useMemo(() => analyseTeam(draft.sets), [draft.sets]);

  const validityState: TbValidity = !draft.packed ? "neutral" : validation.checking || validation.ok === null ? "checking" : validation.ok ? "ok" : "bad";
  const validityText =
    validityState === "neutral"
      ? t("validity.empty")
      : validityState === "checking"
        ? t("validity.checking")
        : validityState === "ok"
          ? t("validity.ok")
          : t("validity.problems", { count: validation.problems.length });

  const monOf = (i: number): TbSlotMon | null => {
    const s = draft.sets[i];
    if (!s?.species) return null;
    const sp = Dex.species.get(s.species);
    // The item through the dex, not the raw field: a packed team stores the
    // id, so the rail read "lightball" beside a set editor showing "Light Ball".
    const item = s.item ? Dex.items.get(s.item) : null;
    return { name: sp.exists ? sp.name : s.species, types: sp.exists ? [...sp.types] : [], item: item?.exists ? item.name : s.item || undefined };
  };

  /**
   * A slot's accessible name.
   *
   * The red bar on a flagged row and the red square on a flagged chip were
   * colour and nothing else — a reader who cannot see them had no way to know
   * which of the six slots the validity list was pointing at.
   */
  const slotLabel = (i: number, mon: TbSlotMon | null) => {
    const base = mon ? `${t("editor.slotN", { n: i + 1 })}: ${mon.name}` : t("editor.slotN", { n: i + 1 });
    return flagged.has(i) ? `${base} · ${t("hasProblem")}` : base;
  };

  // The chip says one of exactly six things, and each of them is something the
  // store or the outbox reported — see `TbSyncState`. The hint spells out what
  // it means for the player's data, because "Pendiente" on its own does not.
  const syncWord = {
    saved: t("sync.saved"),
    syncing: t("sync.syncing"),
    synced: t("sync.synced"),
    pending: t("sync.pending"),
    error: t("sync.error"),
    "local-only": t("sync.localOnly"),
  }[draft.syncState];
  const syncHint = {
    saved: t("sync.savedHint"),
    syncing: t("sync.syncingHint"),
    synced: t("sync.syncedHint"),
    pending: t("sync.pendingHint"),
    error: t("sync.errorHint"),
    "local-only": t("sync.localOnlyHint"),
  }[draft.syncState];

  const hasEmpty = draft.sets.some((s) => isEmptySet(s));
  const slotActions = (i: number, filled: boolean) => (
    <div role="group" aria-label={t("editor.slotN", { n: i + 1 })} className="flex items-center gap-1">
      <TbIconAction name="chevron" flip label={t("editor.moveUp")} disabled={i === 0} onClick={() => { draft.moveSlot(i, -1); selectSlot(i - 1); }} />
      <TbIconAction name="chevronDown" label={t("editor.moveDown")} disabled={i === 5} onClick={() => { draft.moveSlot(i, 1); selectSlot(i + 1); }} />
      <TbIconAction name="copy" label={t("editor.duplicateSlot")} disabled={!filled || !hasEmpty} onClick={() => { const at = draft.duplicateSlot(i); if (at !== null) selectSlot(at); }} />
      <TbIconAction name="trash" label={t("editor.removeSlot")} disabled={!filled} danger onClick={() => draft.removeSlot(i)} />
    </div>
  );

  /* ── Pieces ────────────────────────────────────────────────────────────── */
  const validityPanel = (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <TbValidityChip state={validityState}>{validityText}</TbValidityChip>
        <span className="font-mono text-[0.625rem]/none text-txt-dim">{formatOptions.find((o) => o.value === draft.format)?.label}</span>
      </div>
      <ul aria-live="polite" aria-atomic="false" className="m-0 grid list-none gap-[0.375rem] p-0">
        {problems.length === 0 && draft.packed && validityState === "ok" && (
          <li className="font-body text-[0.8125rem] leading-[1.45] text-txt-dim">{t("validity.none")}</li>
        )}
        {problems.map((p, i) => (
          <li key={i} className="grid gap-[3px] border-l-2 border-solid border-bad pl-[0.5625rem]">
            {p.slot !== null ? (
              <button
                type="button"
                onClick={() => selectSlot(p.slot as number)}
                aria-label={t("validity.goTo", { n: p.slot + 1 })}
                className={cn("m-0 w-fit border-0 bg-transparent p-0 text-left font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.1em] text-bad hover:underline", BSIM_FOCUS)}
              >
                {t("validity.slot", { n: p.slot + 1 })} · {draft.sets[p.slot].species}
              </button>
            ) : (
              <TbKicker className="text-bad">{t("validity.team")}</TbKicker>
            )}
            <span className="font-body text-[0.8125rem] leading-[1.4] text-txt-muted">{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const coveragePanel =
    analysis.members === 0 ? (
      <p className="m-0 font-body text-[0.8125rem] leading-[1.45] text-txt-dim">{t("coverage.emptyLead")}</p>
    ) : (
      <div className="grid gap-2">
        <p className="m-0 font-body text-[0.8125rem] leading-[1.4] text-txt-dim">{t("coverage.lead")}</p>
        <table className="w-full border-collapse font-mono text-[0.6875rem]/none tabular-nums">
          <thead>
            <tr className="text-[0.5625rem] uppercase tracking-[0.1em] text-txt-dim">
              <th scope="col" className="pb-[0.375rem] text-left font-semibold">{t("coverage.type")}</th>
              <th scope="col" className="pb-[0.375rem] text-right font-semibold">{t("coverage.weak")}</th>
              <th scope="col" className="pb-[0.375rem] text-right font-semibold">{t("coverage.resist")}</th>
              <th scope="col" className="pb-[0.375rem] text-right font-semibold">{t("coverage.immune")}</th>
            </tr>
          </thead>
          <tbody>
            {analysis.rows.map((row) => {
              const hot = row.weak >= Math.max(2, Math.ceil(analysis.members / 2));
              return (
                <tr key={row.type} className="border-t border-solid border-line">
                  <td className="py-[0.3125rem]">
                    <TbTypeChip type={row.type} small label={labels.type(row.type)} />
                  </td>
                  <td className={cn("py-[0.3125rem] text-right", row.weak ? (hot ? "font-bold text-bad" : "text-txt") : "text-txt-dim")}>{row.weak || "·"}</td>
                  <td className={cn("py-[0.3125rem] text-right", row.resist ? "text-ok" : "text-txt-dim")}>{row.resist || "·"}</td>
                  <td className={cn("py-[0.3125rem] text-right", row.immune ? "text-signal" : "text-txt-dim")}>{row.immune || "·"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  // The rail is a STABLE list: every row is the same height whether or not it
  // is the selected one. The slot actions used to hang off the selected row as
  // an `aside`, which grew that row by ~32px and shoved every row below it
  // down — clicking through the six slots made the whole list dance. They live
  // in one fixed place instead, directly above the set they act on.
  const railVertical = (
    <nav aria-label={t("editor.railAria")} className="grid content-start gap-2">
      {draft.sets.map((_, i) => {
        const mon = monOf(i);
        return (
          <TbSlotRow
            key={i}
            order={i + 1}
            mon={mon}
            selected={i === slot}
            flag={flagged.has(i)}
            onSelect={() => selectSlot(i)}
            addLabel={t("editor.add")}
            ariaLabel={slotLabel(i, mon)}
          />
        );
      })}
    </nav>
  );

  const railStrip = (
    <nav
      aria-label={t("editor.railAria")}
      className={cn(
        "z-10 -mx-[var(--dk-pad)] border-b border-solid border-line bg-base px-[var(--dk-pad)] py-2",
        pinStrip && "sticky top-[calc(var(--tool-sticky-top,0px)+var(--tool-bar-h,3.625rem))]",
        "grid gap-[0.375rem]",
        tiny ? "grid-cols-3" : "grid-cols-6",
      )}
    >
      {draft.sets.map((_, i) => {
        const mon = monOf(i);
        return (
          <TbSlotChip
            key={i}
            order={i + 1}
            name={mon?.name}
            selected={i === slot}
            flag={flagged.has(i)}
            compact={tiny}
            onSelect={() => selectSlot(i)}
            ariaLabel={slotLabel(i, mon)}
          />
        );
      })}
    </nav>
  );

  // The 1024–1279 disclosure deliberately does NOT use `Disclosure`'s `badge`:
  // that slot is drawn accent-on-accent-soft whatever it says, so an ILLEGAL
  // team announced itself in the brand colour here while the same state was red
  // one breakpoint up. The state goes in `sub`, where it is neutral text, and
  // the coloured chip is the first thing inside the panel. `icon` matches the
  // section this collapses into.
  const centre = (
    <div className="grid min-w-0 content-start gap-4">
      {twoPane && (
        <Disclosure icon="shield" title={t("validity.title")} sub={validityText}>
          <div className="grid gap-5 pt-3">
            {validityPanel}
            <div className="grid gap-2">
              <TbKicker>{t("editor.analysis")}</TbKicker>
              {coveragePanel}
            </div>
          </div>
        </Disclosure>
      )}
      {/* The slot actions, at every breakpoint, in the one place that does not
          move: above the set they act on. Reordering or removing a Pokémon is
          an action ON the open set, so this is also where it belongs. */}
      <div className="flex items-center gap-3">
        <TbKicker>{t("editor.slotN", { n: slot + 1 })}</TbKicker>
        <span className="flex-1" />
        {slotActions(slot, Boolean(draft.sets[slot]?.species))}
      </div>
      <SetEditor
        key={`${team.clientId}-${slot}`}
        set={draft.sets[slot]}
        slotIndex={slot}
        format={draft.format}
        onChange={(next) => draft.updateSet(slot, next)}
      />
    </div>
  );

  const nameBlock = renaming ? (
    <Input
      autoFocus
      value={nameDraft}
      aria-label={t("editor.nameAria")}
      onChange={(e) => setNameDraft(e.target.value)}
      onBlur={commitRename}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitRename();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setRenaming(false);
        }
      }}
      className={cn("h-11 min-w-0 flex-1 py-0 font-display text-[clamp(1.125rem,2.4vw,1.5rem)] font-extrabold italic uppercase leading-none")}
    />
  ) : (
    <button
      type="button"
      onClick={startRename}
      onKeyDown={(e) => {
        if (e.key === "Enter") startRename();
      }}
      title={t("editor.renameHint")}
      aria-label={`${t("editor.nameAria")}: ${draft.name}`}
      className={cn("group flex min-h-8 min-w-0 flex-1 items-center gap-2 border-0 bg-transparent p-0 text-left", BSIM_FOCUS)}
    >
      <h2 className={cn(DISPLAY_VOICE, "m-0 truncate text-[clamp(1.375rem,3vw,1.875rem)] text-txt")}>{draft.name}</h2>
      <Icon name="edit" size={14} className="flex-none text-txt-dim opacity-0 transition-opacity duration-[140ms] group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );

  return (
    <div className="grid content-start gap-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-solid border-line pb-3">
        <DkBack onClick={leave} label={t("backToList")} />
        <div className="flex min-w-0 flex-1 basis-[13.75rem] items-center gap-2">
          {nameBlock}
          <TbSyncChip state={draft.syncState} title={syncHint}>
            {syncWord}
          </TbSyncChip>
        </div>
        <DkSelect value={draft.format} options={formatOptions} onChange={draft.setFormat} ariaLabel={t("formatLabel")} minWidth="160px" />
        <div className="flex items-center gap-2">
          {strip ? (
            <Menu
              align="end"
              size="sm"
              ariaLabel={t("more")}
              label={t("more")}
              items={[
                { label: t("export"), icon: "download", onSelect: () => void doExport() },
                { label: t("import"), icon: "upload", onSelect: () => setImportOpen(true) },
              ]}
            />
          ) : (
            <>
              <Button size="sm" icon="download" onClick={() => void doExport()}>
                {t("export")}
              </Button>
              <Button size="sm" icon="upload" onClick={() => setImportOpen(true)}>
                {t("import")}
              </Button>
            </>
          )}
          <Button size="sm" icon="sword" onClick={() => void play()} disabled={!draft.packed} title={draft.packed ? undefined : t("playDisabled")}>
            {t("play")}
          </Button>
          {/* Not a save — the store already has it. This is the "send it to my
              account NOW" button, for a player who does not want to wait for
              the idle flush or for the editor to close. Never gated on
              legality (D12); the binding check is the server's. */}
          <Button
            size="sm"
            variant="pri"
            icon="refresh"
            onClick={() => void draft.syncNow()}
            loading={draft.syncState === "syncing"}
            disabled={draft.syncState === "local-only"}
            title={draft.syncState === "local-only" ? t("sync.localOnlyHint") : undefined}
          >
            {t("sync.action")}
          </Button>
        </div>
      </header>

      {draft.remoteChanged && (
        <Banner
          tone="warn"
          actions={
            <Button size="sm" onClick={draft.loadRemote}>
              {t("remote.load")}
            </Button>
          }
        >
          {t("remote.changed")}
        </Banner>
      )}

      {strip ? (
        <>
          {railStrip}
          {centre}
        </>
      ) : twoPane ? (
        <div className="grid grid-cols-[17.5rem_minmax(0,1fr)] min-[1600px]:grid-cols-[18.75rem_minmax(0,1fr)] min-[2240px]:grid-cols-[20rem_minmax(0,1fr)] items-start gap-4">
          {railVertical}
          {centre}
        </div>
      ) : (
        <div className="grid grid-cols-[17.5rem_minmax(0,1fr)_18.75rem] min-[1600px]:grid-cols-[18.75rem_minmax(0,1fr)_21.875rem] min-[2240px]:grid-cols-[20rem_minmax(0,1fr)_25rem] items-start gap-4">
          {railVertical}
          {centre}
          <div className="grid content-start gap-4">
            <BsimSection icon="shield" title={t("validity.title")} aside={<TbValidityChip state={validityState}>{validityText}</TbValidityChip>}>
              {validityPanel}
            </BsimSection>
            <BsimSection icon="target" title={t("editor.analysis")}>
              {coveragePanel}
            </BsimSection>
          </div>
        </div>
      )}

      <ImportPasteModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        note={t("importModal.replaceNote")}
        onImport={(sets) => {
          draft.replaceSets(sets);
          selectSlot(0);
          toast.success(t("toast.imported"));
        }}
      />
    </div>
  );
}
