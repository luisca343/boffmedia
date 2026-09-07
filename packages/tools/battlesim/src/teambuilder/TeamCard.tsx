"use client";

/**
 * One team in the list: name · format · six sprites · validity · actions.
 *
 * Validation is asked for lazily — when the card has scrolled into view — and
 * goes through the pooled worker, so a long list boots one validator and
 * checks what is on screen first.
 */

import * as React from "react";
import { unpackTeam } from "@boffmedia/battle-core";
import { Button, HoverCard, Icon, IconButton, Input, Menu, cn } from "@boffmedia/ui";

import { useToolT } from "../i18n";
import { TB_NS } from "./labels";
import { TbSpriteThumb, TbValidityChip, type TbValidity } from "./tb-kit";
import { useTeamValidation } from "./useTeamValidation";
import { SyncIndicator } from "./SyncIndicator";
import type { LibraryTeam } from "./library-types";

export interface TeamCardProps {
  team: LibraryTeam;
  viewMode?: "grid" | "list";
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onExport: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onToggleFavorite: () => void;
  onTogglePinned: () => void;
}

function ValidityHover({ label, problems, children }: { label: string; problems: string[]; children: React.ReactNode }) {
  return (
    <HoverCard
      side="top"
      trigger={children}
      ariaLabel={label}
      className="w-[min(20rem,calc(100vw-1rem))]"
    >
      <div className="grid gap-2 whitespace-normal text-left">
        <div className="flex items-center gap-2 border-b border-solid border-line-2 pb-2 font-display text-[0.75rem] font-bold uppercase tracking-[0.04em] text-txt">
          <Icon name="alert" size={12} className="text-bad" />
          {label}
        </div>
        <ul className="m-0 grid max-h-[12rem] list-none gap-1 overflow-y-auto p-0 font-body text-[0.6875rem] leading-[1.35] text-txt-muted">
          {problems.map((problem, index) => (
            <li key={`${problem}-${index}`} className="flex gap-2">
              <span aria-hidden className="mt-[0.35em] h-1 w-1 flex-none bg-bad" />
              <span>{problem}</span>
            </li>
          ))}
        </ul>
      </div>
    </HoverCard>
  );
}

export function TeamCard({ team, viewMode = "grid", onPlay, onEdit, onDuplicate, onRename, onExport, onDelete, onAddTag, onRemoveTag, onToggleFavorite, onTogglePinned }: TeamCardProps) {
  const t = useToolT(TB_NS);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState(team.name);
  const [addingTag, setAddingTag] = React.useState(false);
  const [tagDraft, setTagDraft] = React.useState("");

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const validation = useTeamValidation(team.format, team.packed, { enabled: visible });
  const species = React.useMemo(() => {
    let sets = null;
    try {
      sets = team.packed ? unpackTeam(team.packed) : null;
    } catch {
      sets = null;
    }
    return (sets ?? []).map((s) => s.species).filter(Boolean).slice(0, 6);
  }, [team.packed]);

  const state: TbValidity = !team.packed ? "neutral" : validation.checking || validation.ok === null ? "checking" : validation.ok ? "ok" : "bad";
  const chipText =
    state === "neutral"
      ? t("validity.empty")
      : state === "checking"
        ? t("validity.checking")
        : state === "ok"
          ? t("validity.ok")
          : t("validity.problems", { count: validation.problems.length });

  const commitRename = () => {
    const next = draft.trim();
    setRenaming(false);
    if (next && next !== team.name) onRename(next);
    else setDraft(team.name);
  };

  const commitTag = () => {
    const next = tagDraft.trim().toLowerCase();
    setAddingTag(false);
    if (next && !(team.tags ?? []).includes(next)) {
      onAddTag(next);
    }
    setTagDraft("");
  };

  return (
    <article
      ref={ref}
      aria-label={team.name}
      className={cn(
        "cut-corner cut-corner-edge [--cut-lg:14px] [--cut-line:var(--line)] flex min-w-0 flex-col border border-solid border-line bg-panel transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)]",
        viewMode === "list" && "min-[900px]:grid min-[900px]:grid-cols-[minmax(11rem,1.1fr)_minmax(18rem,1.5fr)_minmax(11rem,1fr)_minmax(16rem,auto)] min-[900px]:items-stretch",
      )}
    >
      <header className={cn("flex min-h-[3.125rem] items-center gap-2 border-b border-solid border-line px-4 py-2", viewMode === "list" && "min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:border-r-[color-mix(in_srgb,var(--line)_45%,transparent)]")}>
        {renaming ? (
          <Input
            size="sm"
            autoFocus
            value={draft}
            aria-label={t("editor.nameAria")}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setDraft(team.name);
                setRenaming(false);
              }
            }}
            className="min-w-0 flex-1 font-display text-[0.875rem] font-bold uppercase"
          />
        ) : (
          <h3 className="m-0 min-w-0 flex-1 truncate font-display text-[1rem]/none font-bold not-italic uppercase tracking-[0.03em] text-txt">{team.name}</h3>
        )}
        <IconButton size="sm" name="star" variant={team.favorite ? "pri" : "ghost"} label={t(team.favorite ? "meta.unfavorite" : "meta.favorite")} onClick={onToggleFavorite} className={team.favorite ? "text-accent" : undefined} />
        <IconButton size="sm" name="bookmark" variant={team.pinned ? "pri" : "ghost"} label={t(team.pinned ? "meta.unpin" : "meta.pin")} onClick={onTogglePinned} className={team.pinned ? "text-signal" : undefined} />
        <SyncIndicator clientUpdatedAt={team.clientUpdatedAt ?? null} serverUpdatedAt={team.updatedAt} />
      </header>

      {/* The six squares were the card's only statement of WHO is on the team,
          and every one of them was `aria-hidden` — the empty ones by design,
          the filled ones because a sprite's alt is its species and six of those
          read as a list of nothing. One label on the row says it once. */}
      <div
        role="img"
        aria-label={species.length ? t("slotsAria", { list: species.join(", ") }) : t("slotsEmpty")}
        className={cn("flex items-center gap-[0.375rem] px-4 py-[0.875rem]", viewMode === "list" && "min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:py-2 min-[900px]:border-r min-[900px]:border-r-[color-mix(in_srgb,var(--line)_45%,transparent)]")}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <TbSpriteThumb key={i} name={species[i]} size={viewMode === "list" ? 40 : 44} />
        ))}
      </div>

      {/* Tags section */}
      <div className={cn("flex flex-wrap items-center gap-2 border-t border-solid border-line px-3 py-2", viewMode === "list" && "min-[900px]:col-start-3 min-[900px]:row-start-1 min-[900px]:border-t-0 min-[900px]:border-r min-[900px]:border-r-[color-mix(in_srgb,var(--line)_45%,transparent)]")}>
        {(team.tags ?? []).length > 0 && (
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
            {(team.tags ?? []).map((tag) => (
              <div
                key={tag}
                className="cut cut-edge-slant [--cut:3px] inline-flex max-w-full items-center gap-1 border border-solid border-accent-line bg-accent-soft px-2 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-accent"
              >
                <span className="min-w-0 truncate">{tag}</span>
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="ml-0.5 flex h-4 w-4 flex-none items-center justify-center border-0 bg-transparent p-0 text-inherit opacity-60 transition-opacity hover:opacity-100"
                  aria-label={t("tags.remove", { tag })}
                  type="button"
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        {addingTag ? (
          <Input
            size="sm"
            autoFocus
            value={tagDraft}
            placeholder={t("tags.placeholder")}
            onChange={(e) => setTagDraft(e.target.value)}
            onBlur={commitTag}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTag();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setAddingTag(false);
                setTagDraft("");
              }
            }}
            className="w-full min-[900px]:w-[10rem]"
          />
        ) : (
          <Button
            size="sm"
            variant="ghost"
            icon="plus"
            onClick={() => setAddingTag(true)}
            className="w-auto shrink-0"
          >
            {t("tags.add")}
          </Button>
        )}
        {team.notes && (
          <div className="basis-full flex min-w-0 items-center gap-2 text-[0.6875rem] text-txt-dim">
            <span className="truncate" title={team.notes}>· {team.notes}</span>
          </div>
        )}
      </div>

      <footer className={cn("mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-solid border-line px-3 py-[0.625rem]", viewMode === "list" && "min-[900px]:col-start-4 min-[900px]:row-start-1 min-[900px]:flex min-[900px]:justify-end min-[900px]:border-t-0 min-[900px]:py-2")}>
        <div className="min-w-0">
          {state === "bad" ? (
            <ValidityHover label={chipText} problems={validation.problems}>
              <TbValidityChip size="xs" state={state}>
                <span className="sr-only">{chipText}</span>
              </TbValidityChip>
            </ValidityHover>
          ) : (
            <TbValidityChip size="xs" state={state}>
              <span className="sr-only">{chipText}</span>
            </TbValidityChip>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Keep the action cluster atomic so a longer problem count never
              pushes the overflow menu onto a second flex line. */}
          <Button size="sm" variant="pri" icon="sword" onClick={onPlay} disabled={!team.packed} title={team.packed ? undefined : t("playDisabled")}>
            {t("play")}
          </Button>
          <Button size="sm" icon="edit" onClick={onEdit}>
            {t("edit")}
          </Button>
          {/* Menu's own icon trigger, the same one the replays list uses. A
              hand-built `<span>` trigger cannot carry the button recipe's focus
              ring — a span is not focusable, so `focus-visible` never matched. */}
          <Menu
            align="end"
            size="sm"
            variant="ghost"
            icon="more"
            label=""
            ariaLabel={t("more")}
            items={[
              { label: t("duplicate"), icon: "copy", onSelect: onDuplicate },
              {
                label: t("rename"),
                icon: "edit",
                onSelect: () => {
                  setDraft(team.name);
                  setRenaming(true);
                },
              },
              { label: t("export"), icon: "download", onSelect: onExport },
              { sep: true },
              { label: t("delete"), icon: "trash", danger: true, onSelect: onDelete },
            ]}
          />
        </div>
      </footer>
    </article>
  );
}
