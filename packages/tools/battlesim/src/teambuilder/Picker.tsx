"use client";

/**
 * The one picker: species, moves, items and abilities through a single dialog.
 *
 * Search field with combobox semantics, optional filter chips, a windowed
 * listbox (rows are absolutely positioned inside a box the height of the whole
 * list, so 900 moves cost ~14 DOM rows), arrow keys with the active row kept in
 * view, Enter to pick, Escape handled by the `Modal`. Recent picks lead the
 * list when there is no query — an in-memory ring per kind, because a session
 * of building one team reuses the same forty moves.
 *
 * For moves AND species the list is FORMAT-AWARE but never censored. What the
 * regulation allows comes first; everything else is still offered, sorted last
 * and marked ILEGAL in red. That is Showdown's behaviour and it is the right
 * one: a builder is for theorycrafting as much as for tournament sets, our
 * model of a custom regulation may not be perfect, and the validator is the
 * authority that will object anyway. `legalMoves` / `legalSpecies` are those
 * answers and `loading` is one being fetched; a null or empty set means the
 * lookup could not answer, and then nothing is marked — an unknown answer must
 * never read as "this Pokémon learns nothing" or "this format has no Pokémon".
 */

import * as React from "react";
import { Dex } from "@pkmn/dex";
import { cn, Icon, Input, Modal, Spinner } from "@boffmedia/ui";

import { BSIM_FOCUS, BSIM_FOCUS_CUT } from "../components/bsim-kit";
import { BxType, BxTypeRow, BxCat } from "../components/bx-kit";
import { useToolT } from "../i18n";
import { usePkmnLabels } from "../lib/pkmn-label";
import { TB_NS, TYPE_LIST, toId, useTbLabels } from "./labels";
import { itemIconStyle, speciesSprite, TbTypeChip } from "./tb-kit";
import { handleSpriteError } from "@boffmedia/tools-pokemon";
import { useAllSpecies } from "./useTeamValidation";

export type PickerKind = "species" | "move" | "item" | "ability";

export interface PickerProps {
  open: boolean;
  kind: PickerKind;
  value?: string;
  onPick: (id: string) => void;
  onClose: () => void;
  /** Move picker: the ids that are legal here. Everything else is still offered,
   *  sorted last and marked. Empty/null/undefined = unknown, so nothing is marked. */
  legalMoves?: Set<string> | null;
  /** Species picker: the roster this regulation allows. Same contract as `legalMoves`. */
  legalSpecies?: Set<string> | null;
  /** Move picker: the legal set is still on its way. Shows a wait, never an empty list. */
  loading?: boolean;
  /** Ability picker: the species' own abilities, listed first. */
  preferredIds?: string[];
  /** Ids to leave out — the moves already in the other three slots. */
  excludeIds?: string[];
}

/* ── Sources ─────────────────────────────────────────────────────────────── */

interface Row {
  id: string;
  /**
   * The ENGLISH name, always. It is what goes into the set, into a paste and
   * into `itemIconStyle`/`speciesSprite`, none of which have ever heard of
   * Spanish. What the row SHOWS is `label`.
   */
  name: string;
  /** What to print: the name in the player's chosen language, or `name`. */
  label?: string;
  /** Lower-cased search key. */
  key: string;
  /** Search key for `label`, when it differs — so both languages find the row. */
  altKey?: string;
  types?: string[];
  cat?: string;
  num?: number;
  figures?: string[];
  sub?: string;
}

const CAT_KEY: Record<string, string> = { Physical: "phys", Special: "spec", Status: "status" };
const HIDDEN_NONSTANDARD = new Set(["CAP", "Custom", "Future", "Pokestar"]);

const sources: Partial<Record<PickerKind, Row[]>> = {};

function loadSource(kind: PickerKind): Row[] {
  const hit = sources[kind];
  if (hit) return hit;
  let rows: Row[];
  if (kind === "species") {
    rows = Dex.species
      .all()
      .filter((s) => s.exists && s.num > 0 && !s.battleOnly && !HIDDEN_NONSTANDARD.has(s.isNonstandard ?? ""))
      .sort((a, b) => a.num - b.num || a.name.localeCompare(b.name))
      .map((s) => ({ id: s.id, name: s.name, key: toId(s.name), types: [...s.types], num: s.bst }));
  } else if (kind === "move") {
    rows = Dex.moves
      .all()
      .filter((m) => m.exists && m.num > 0 && !m.isZ && !m.isMax && !HIDDEN_NONSTANDARD.has(m.isNonstandard ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({
        id: m.id,
        name: m.name,
        key: toId(m.name),
        types: [m.type],
        cat: m.category,
        figures: [m.basePower ? String(m.basePower) : "—", m.accuracy === true ? "—" : `${m.accuracy}%`, String(m.pp)],
        sub: m.shortDesc || m.desc,
      }));
  } else if (kind === "item") {
    rows = Dex.items
      .all()
      .filter((i) => i.exists && i.num > 0 && !HIDDEN_NONSTANDARD.has(i.isNonstandard ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => ({ id: i.id, name: i.name, key: toId(i.name), sub: i.shortDesc || i.desc }));
  } else {
    rows = Dex.abilities
      .all()
      .filter((a) => a.exists && a.num > 0 && !HIDDEN_NONSTANDARD.has(a.isNonstandard ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((a) => ({ id: a.id, name: a.name, key: toId(a.name), sub: a.shortDesc || a.desc }));
  }
  sources[kind] = rows;
  return rows;
}

/* ── Recents ─────────────────────────────────────────────────────────────── */

const RECENTS_MAX = 8;
const recents: Record<PickerKind, string[]> = { species: [], move: [], item: [], ability: [] };

function pushRecent(kind: PickerKind, id: string) {
  const list = recents[kind].filter((x) => x !== id);
  list.unshift(id);
  recents[kind] = list.slice(0, RECENTS_MAX);
}

/* ── List model ──────────────────────────────────────────────────────────── */

type Entry = { kind: "header"; label: string } | { kind: "row"; row: Row; optionIndex: number; illegal?: boolean };

const ROW_H = 46;
const OVERSCAN = 6;

/* ── Component ───────────────────────────────────────────────────────────── */

export function Picker({ open, kind, value, onPick, onClose, legalMoves, legalSpecies, loading, preferredIds, excludeIds }: PickerProps) {
  const t = useToolT(TB_NS);
  const labels = useTbLabels();
  const allSpecies = useAllSpecies();
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewH, setViewH] = React.useState(400);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  // Fresh every time it opens; the Modal keeps focus for itself on mount, so
  // the field is focused a tick later.
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setTypeFilter("");
    setCatFilter("");
    setActive(0);
    setScrollTop(0);
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open, kind]);

  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const measure = () => setViewH(el.clientHeight || 400);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [open]);

  const pkmn = usePkmnLabels();

  const source = React.useMemo(() => {
    if (!open) return [];
    const rows: Row[] =
      kind === "species"
        ? // Convert species picker data from worker to Row format
          allSpecies.species.map((s) => ({
            id: s.id,
            name: s.name,
            key: toId(s.name),
            types: s.types,
            num: s.bst,
          }))
        : loadSource(kind);
    // Species are not translated — Spanish uses the English names — so that
    // list is handed back as it is rather than copied to change nothing.
    if (kind === "species" || pkmn.names.locale === "en") return rows;
    const localize = pkmn.names[kind];
    return rows
      .map((row) => {
        const label = localize(row.name);
        return label === row.name ? row : { ...row, label, altKey: toId(label) };
      })
      // Alphabetical in the language being read: a Spanish list sorted by the
      // English names looks unsorted, which is worse than either order.
      .sort((a, b) => (a.label ?? a.name).localeCompare(b.label ?? b.name, "es"));
  }, [open, kind, allSpecies.species, pkmn]);
  const exclude = React.useMemo(() => new Set((excludeIds ?? []).filter(Boolean)), [excludeIds]);

  const { entries, options, total } = React.useMemo(() => {
    const q = toId(query);
    const filtered = source.filter((r) => {
      if (exclude.has(r.id) && r.id !== value) return false;
      if (typeFilter && !(r.types ?? []).includes(typeFilter)) return false;
      if (catFilter && "cat" in r && r.cat !== catFilter) return false;
      // Both languages, whichever one is on screen: years of typing
      // "flamethrower" do not end because the labels turned Spanish, and a
      // player told "usa Lanzallamas" must find it while reading English.
      return !q || r.key.includes(q) || !!r.altKey?.includes(q);
    });
    // Prefix matches first, then the rest — typing "garg" should put Garganacl
    // above anything that merely contains the letters.
    const prefix = (r: Row) => Number(r.key.startsWith(q) || !!r.altKey?.startsWith(q));
    if (q) filtered.sort((a, b) => prefix(b) - prefix(a));

    const out: Entry[] = [];
    let optionIndex = 0;
    const push = (row: Row, illegal = false) => {
      out.push({ kind: "row", row, optionIndex: optionIndex++, illegal });
    };

    // A move the species cannot use in this format is still OFFERED — Showdown
    // lets you build an illegal set and tells you it is illegal, which is what
    // makes the builder usable for theorycrafting and for formats whose rules
    // we may not model perfectly. It is sorted last and marked, never hidden.
    // A null or empty `legalMoves` is "no answer", and then nothing is marked.
    const learnable = kind === "move" && legalMoves && legalMoves.size > 0 ? legalMoves : null;
    const roster = kind === "species" && legalSpecies && legalSpecies.size > 0 ? legalSpecies : null;
    const allowed = learnable ?? roster;
    const legal: Row[] = [];
    const illegal: Row[] = [];
    const preferred = new Set(preferredIds ?? []);
    const preferredRows: Row[] = [];
    for (const r of filtered) {
      if (allowed && !allowed.has(r.id)) illegal.push(r);
      else if (preferred.has(r.id)) preferredRows.push(r);
      else legal.push(r);
    }
    const offered = preferredRows.length + legal.length + illegal.length;

    if (!q && !typeFilter && !catFilter && recents[kind].length) {
      const offeredIds = new Set([...preferredRows, ...legal].map((r) => r.id));
      const byId = new Map(filtered.map((r) => [r.id, r]));
      const recentRows = recents[kind].map((id) => byId.get(id)).filter((r): r is Row => !!r && offeredIds.has(r.id));
      if (recentRows.length) {
        out.push({ kind: "header", label: t("picker.recents") });
        for (const r of recentRows) push(r);
      }
    }
    for (const r of preferredRows) push(r);
    for (const r of legal) push(r);
    for (const r of illegal) push(r, true);
    const opts = out.filter((e): e is Extract<Entry, { kind: "row" }> => e.kind === "row");
    return { entries: out, options: opts, total: offered };
  }, [source, query, typeFilter, catFilter, exclude, value, preferredIds, legalMoves, legalSpecies, kind, t]);

  React.useEffect(() => setActive(0), [query, typeFilter, catFilter]);

  // Keep the active option inside the scrollport. The row may not be rendered
  // yet (windowing), so the maths is on indexes rather than on elements.
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const entryIdx = entries.findIndex((e) => e.kind === "row" && e.optionIndex === active);
    if (entryIdx < 0) return;
    const top = entryIdx * ROW_H;
    const bottom = top + ROW_H;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  }, [active, entries]);

  const pick = (id: string) => {
    pushRecent(kind, id);
    onPick(id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = options.length;
    if (!n) return;
    const page = Math.max(1, Math.floor(viewH / ROW_H) - 1);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(n - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "PageDown":
        e.preventDefault();
        setActive((a) => Math.min(n - 1, a + page));
        break;
      case "PageUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - page));
        break;
      case "Home":
        if (query) return;
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (query) return;
        e.preventDefault();
        setActive(n - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const hit = options[active];
        if (hit) pick(hit.row.id);
        break;
      }
    }
  };

  // Keyed by POSITION in the option list, not by row id: a recent pick is also
  // in the list below it, so the same id appears twice — as two React keys
  // React warns about and, worse, two elements answering to one
  // `aria-activedescendant`.
  const activeId = options[active] ? `${listId}-${active}` : undefined;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(entries.length, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);
  const placeholder = t(`picker.search${kind[0].toUpperCase()}${kind.slice(1)}` as "picker.searchMove");

  return (
    <Modal open={open} onClose={onClose} title={t(`picker.${kind}`)} size="lg" bodyClassName="p-0 overflow-hidden flex flex-col">
      <div className="grid gap-[0.625rem] border-b border-solid border-line px-4 pb-3 pt-[0.875rem]">
        <div className="relative">
          <Icon name="search" size={15} className="pointer-events-none absolute left-[0.6875rem] top-1/2 -translate-y-1/2 text-txt-dim" />
          <Input
            ref={inputRef}
            size="sm"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            aria-label={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-[2.375rem] pl-9 text-[0.8125rem]"
          />
        </div>
        {(kind === "species" || kind === "move") && (
          <div className="grid gap-2">
            <div role="radiogroup" aria-label={t("picker.typeFilter")} className="flex flex-wrap gap-[0.3125rem]">
              <button
                type="button"
                role="radio"
                aria-checked={!typeFilter}
                onClick={() => setTypeFilter("")}
                className={cn(
                  "cut cut-edge-slant [--cut:3px] inline-flex h-8 items-center border border-solid px-[0.625rem] font-mono text-[0.5625rem]/none font-semibold uppercase tracking-[0.08em] transition-[background,color,border-color] duration-[140ms]",
                  !typeFilter
                    ? "border-accent [--cut-line:var(--accent)] bg-accent text-accent-ink"
                    : "border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-muted hover:text-txt",
                  BSIM_FOCUS_CUT,
                )}
              >
                {t("picker.allTypes")}
              </button>
              {TYPE_LIST.map((ty) => (
                <TbTypeChip key={ty} type={ty} small label={labels.type(ty)} on={typeFilter === ty} onClick={() => setTypeFilter(typeFilter === ty ? "" : ty)} />
              ))}
            </div>
            {kind === "move" && (
              <div role="radiogroup" aria-label={t("picker.catFilter")} className="flex gap-[0.3125rem]">
                {(["Physical", "Special", "Status"] as const).map((c) => {
                  const on = catFilter === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setCatFilter(on ? "" : c)}
                      className={cn(
                        "cut-tag cut-tag-edge [--cut-tag:6px] inline-flex h-8 items-center gap-1 border border-solid px-[0.625rem] font-mono text-[0.5625rem]/none font-semibold uppercase tracking-[0.08em] transition-[background,color,border-color] duration-[140ms]",
                        on
                          ? "border-accent [--cut-line:var(--accent)] bg-accent-soft text-accent"
                          : "border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-muted hover:text-txt",
                        BSIM_FOCUS_CUT,
                      )}
                    >
                      <BxCat cat={CAT_KEY[c]} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t("picker.listAria")}
        tabIndex={-1}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="relative h-[min(56dvh,28.75rem)] overflow-y-auto overscroll-contain"
      >
        {loading || (kind === "species" && allSpecies.loading) ? (
          <p aria-live="polite" className="m-0 flex items-center justify-center gap-2 px-4 py-10 font-body text-[0.8125rem] text-txt-dim">
            <Spinner size={14} />
            {kind === "species" ? t("picker.loadingSpecies") : t("picker.loadingMoves")}
          </p>
        ) : entries.length === 0 ? (
          <p className="m-0 px-4 py-10 text-center font-body text-[0.8125rem] text-txt-dim">{t("picker.noResults")}</p>
        ) : (
          <div style={{ height: entries.length * ROW_H }} className="relative">
            {entries.slice(start, end).map((entry, i) => {
              const top = (start + i) * ROW_H;
              if (entry.kind === "header") {
                return (
                  <div
                    key={`h-${start + i}`}
                    role="presentation"
                    style={{ top, height: ROW_H }}
                    className="absolute inset-x-0 flex items-end gap-2 px-4 pb-[0.375rem]"
                  >
                    <span className="font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.1em] text-txt-dim">{entry.label}</span>
                    <span className="mb-[3px] h-px flex-1 bg-line" />
                  </div>
                );
              }
              const { row, optionIndex, illegal } = entry;
              const isActive = optionIndex === active;
              const isCurrent = row.id === value;
              return (
                <div
                  key={`${optionIndex}-${row.id}`}
                  id={`${listId}-${optionIndex}`}
                  role="option"
                  aria-selected={isActive}
                  aria-current={isCurrent || undefined}
                  style={{ top, height: ROW_H }}
                  onMouseMove={() => !isActive && setActive(optionIndex)}
                  onClick={() => pick(row.id)}
                  className={cn(
                    "absolute inset-x-0 flex cursor-pointer items-center gap-[0.625rem] border-l-[3px] px-4 transition-[background,border-color] duration-[140ms]",
                    isActive ? "bg-accent-soft" : "hover:bg-panel-2",
                    // The red edge is a second, non-colour-blind-safe cue only;
                    // the ILEGAL tag inside the row carries the meaning in text.
                    illegal ? "border-l-bad" : isActive ? "border-l-accent" : "border-l-transparent",
                  )}
                >
                  <RowBody kind={kind} row={row} illegal={illegal} />
                  {isCurrent && <Icon name="check" size={14} className="flex-none text-accent" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-solid border-line px-4 py-[0.5625rem] font-mono text-[0.625rem]/none tabular-nums text-txt-dim">
        <span aria-live="polite">{t("picker.showing", { shown: options.length, total })}</span>
        <span className="flex-1" />
        <span className="hidden min-[560px]:inline">{t("picker.hint")}</span>
      </div>
    </Modal>
  );
}

/* ── Row bodies ──────────────────────────────────────────────────────────── */

/**
 * The red "ILEGAL" tag. Text, not just a colour: the row's left edge is red too,
 * but a reader who cannot see it needs the word, and `role="option"` exposes the
 * row's text content as its accessible name.
 */
function IllegalTag() {
  const t = useToolT(TB_NS);
  return (
    <b className="cut cut-edge-slant [--cut:3px] flex-none border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-[0.3125rem] py-[3px] font-mono text-[0.53125rem]/none font-bold uppercase tracking-[0.08em] text-bad">
      {t("picker.illegal")}
    </b>
  );
}

function RowBody({ kind, row, illegal }: { kind: PickerKind; row: Row; illegal?: boolean }) {
  const t = useToolT(TB_NS);
  if (kind === "species") {
    return (
      <>
        <img src={speciesSprite(row.name)} alt="" width={36} height={36} loading="lazy" onError={handleSpriteError} className={cn("h-9 w-9 flex-none object-contain", illegal && "opacity-60 saturate-[0.4]")} />
        <span className={cn("min-w-0 flex-1 truncate font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.03em]", illegal ? "text-txt-muted" : "text-txt")}>{row.label ?? row.name}</span>
        {illegal && <IllegalTag />}
        <BxTypeRow types={row.types ?? []} small />
        <span className="w-[3.5rem] flex-none text-right font-mono text-[0.625rem]/none text-txt-dim">
          <b className="text-txt-muted">{row.num}</b> {t("picker.bst")}
        </span>
      </>
    );
  }
  if (kind === "move") {
    return (
      <>
        <span className={cn("min-w-0 flex-1 truncate font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.03em]", illegal ? "text-txt-muted" : "text-txt")}>{row.label ?? row.name}</span>
        {illegal && <IllegalTag />}
        <span className="hidden min-[560px]:inline-flex">{row.cat && <BxCat cat={CAT_KEY[row.cat] ?? "status"} />}</span>
        <BxType type={row.types?.[0] ?? "Normal"} small />
        <span className="grid w-[7.5rem] flex-none grid-cols-3 text-right font-mono text-[0.625rem]/none tabular-nums text-txt-muted">
          {row.figures?.map((f, i) => <span key={i}>{f}</span>)}
        </span>
      </>
    );
  }
  if (kind === "item") {
    const style = itemIconStyle(row.name);
    return (
      <>
        <span aria-hidden className="grid h-6 w-6 flex-none place-items-center">
          {style ? <span style={style} className="block" /> : <i className="h-2 w-2 bg-line-2" />}
        </span>
        <span className="grid min-w-0 flex-1 gap-[3px]">
          <span className="truncate font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.03em] text-txt">{row.label ?? row.name}</span>
          {row.sub && <span className="truncate font-body text-[0.6875rem]/none text-txt-dim">{row.sub}</span>}
        </span>
      </>
    );
  }
  return (
    <span className="grid min-w-0 flex-1 gap-[3px]">
      <span className="truncate font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.03em] text-txt">{row.label ?? row.name}</span>
      {row.sub && <span className="truncate font-body text-[0.6875rem]/none text-txt-dim">{row.sub}</span>}
    </span>
  );
}

/** Class used by callers that want a picker-opening trigger to read as a field. */
export const PICKER_TRIGGER = cn(
  "cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] flex h-10 w-full min-w-0 items-center gap-2 border border-solid border-line-2 bg-base px-3 text-left transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2",
  BSIM_FOCUS_CUT,
);
