"use client";

/**
 * One team in the list: name · format · six sprites · validity · actions.
 *
 * Validation is asked for lazily — when the card has scrolled into view — and
 * goes through the pooled worker, so a long list boots one validator and
 * checks what is on screen first.
 */

import * as React from "react";
import { unpackTeam, type TeamRecord } from "@boffmedia/battle-core";
import { Button, Input, Menu } from "@boffmedia/ui";
import { DkChip } from "@boffmedia/ui/datakit";

import { useToolT } from "../i18n";
import { TB_NS } from "./labels";
import { TbSpriteThumb, TbValidityChip, type TbValidity } from "./tb-kit";
import { useTeamValidation } from "./useTeamValidation";

export interface TeamCardProps {
  team: TeamRecord;
  formatLabel: string;
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onExport: () => void;
  onDelete: () => void;
}

export function TeamCard({ team, formatLabel, onPlay, onEdit, onDuplicate, onRename, onExport, onDelete }: TeamCardProps) {
  const t = useToolT(TB_NS);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState(team.name);

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
    const sets = team.packed ? unpackTeam(team.packed) : null;
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

  return (
    <article
      ref={ref}
      aria-label={team.name}
      className="cut-corner cut-corner-edge [--cut-lg:14px] [--cut-line:var(--line)] flex min-w-0 flex-col border border-solid border-line bg-panel transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)]"
    >
      <header className="flex min-h-[50px] items-center gap-2 border-b border-solid border-line px-4 py-2">
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
            className="min-w-0 flex-1 font-display text-[14px] font-bold uppercase"
          />
        ) : (
          <h3 className="m-0 min-w-0 flex-1 truncate font-display text-[16px]/none font-bold not-italic uppercase tracking-[0.03em] text-txt">{team.name}</h3>
        )}
        <DkChip className="flex-none">{formatLabel}</DkChip>
      </header>

      {/* The six squares were the card's only statement of WHO is on the team,
          and every one of them was `aria-hidden` — the empty ones by design,
          the filled ones because a sprite's alt is its species and six of those
          read as a list of nothing. One label on the row says it once. */}
      <div
        role="img"
        aria-label={species.length ? t("slotsAria", { list: species.join(", ") }) : t("slotsEmpty")}
        className="flex items-center gap-[6px] px-4 py-[14px]"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <TbSpriteThumb key={i} name={species[i]} size={44} />
        ))}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-solid border-line px-3 py-[10px]">
        <TbValidityChip state={state} title={validation.problems.length ? validation.problems.join("\n") : undefined}>
          {chipText}
        </TbValidityChip>
        <span className="flex-1" />
        {/* A disabled control with no reason beside it is a dead end; the
            title is the only surface a footer this tight has room for. */}
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
      </footer>
    </article>
  );
}
