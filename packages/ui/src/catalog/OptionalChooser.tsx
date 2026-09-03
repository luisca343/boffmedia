import * as React from "react";

import { cn } from "../cn";
import { Badge } from "../primitives/badge";
import { Icon } from "../primitives/icon";
import { useRoving } from "../primitives/roving";
import { Spinner } from "../primitives/spinner";
import { CatalogIcon } from "./CatalogIcon";
import type { OptionalFeature, OptionalGroup } from "./types";

// The player's side of optional content: named groups of features, each a
// switch or a radio.
//
// The unit is a FEATURE, never a file. "Shaders" is Iris + Sodium + a config +
// the `.zip`, and a UI that offered four switches would let a player build a
// crash. So a feature owns its paths, the host toggles the feature, and the
// backend decides what that means on disk.
//
// Host-agnostic like the rest of `@boffmedia/ui`: `t` is a prop rather than
// `useT()`, for the reason ModBrowser gives — the ui runtime's translator is
// bound to the primitives namespace and these strings live in each host's own.
// `readOnly` is what lets the same component render a pack's public page, where
// there is nothing to toggle and the question is only "what does this offer?".
//
// Each feature is a CARD in the `SelectCard` grammar — check box on the left,
// accent border and soft tint when on — rather than a dense bordered row. A
// choice the player makes once per pack deserves the room to read what it is:
// the icon, a sentence-case description and the consequences as chips, not a
// single uppercase mono line that shouts "SI LO QUITAS, DEJA DE FUNCIONAR".

export type OptionalChooserLabels =
  | "optionalTitle"
  | "optionalEmpty"
  | "optionalRecommended"
  | "optionalDefaultOn"
  | "optionalDefaultOff"
  | "optionalNone"
  | "optionalNeedsDownload"
  | "optionalDeferred"
  | "optionalRequires"
  | "optionalPickOne"
  | "optionalPickAny"
  | "optionalPickAtMostOne"
  | "optionalGroupCount"
  | "optionalAll"
  | "optionalClear"
  | "optionalBreaks"
  | "optionalUsesLibrary"
  | "kindResourcepack"
  | "kindShaderpack"
  | "kindDatapack";

export type OptionalChooserProps = {
  groups: OptionalGroup[];
  /** Called with the feature the player touched. The HOST re-renders from what
   *  its backend returns rather than patching the row optimistically: a toggle
   *  is rarely one feature, since a radio group turns its siblings off and
   *  `requires` pulls dependencies on or takes dependents down. */
  onToggle?: (featureId: string, enabled: boolean) => void;
  /** Feature ids currently mid-flight, rendered non-interactive. */
  busy?: string[];
  /** Turn a whole `any` group on or off in one gesture.
   *
   *  Absent means no bulk control is drawn, which is the right default: on a
   *  two-feature group the button costs more attention than the two clicks it
   *  saves. It only appears from BULK_THRESHOLD features up, and never on an
   *  exclusive group — "all" is precisely what a radio cannot do.
   *
   *  The host decides what one gesture means against its backend; the chooser
   *  only reports which group and which direction. */
  onBulkToggle?: (groupId: string, enabled: boolean) => void;
  /** Per-feature consequences read off the jars (`instanceModGraph`).
   *
   *  `breaks` names the OTHER features that stop working if this one is turned
   *  off — the reverse of `requires`, which the card already renders forwards.
   *  A player looking at Sodium has no way to know Iris needs it; the manifest
   *  cannot tell them, because the fact lives inside the jar.
   *
   *  `libraries` names the always-installed files this feature leans on, which
   *  is the answer to "why is that 7 MB Kotlin jar in my pack". */
  consequences?: Record<string, { breaks?: string[]; libraries?: string[] }>;
  /** Feature ids whose choice is saved but waits for the next launch (D3). */
  deferred?: string[];
  /** No switches, no radios — just what the pack offers. What a public pack
   *  page and the pre-install preview both want. */
  readOnly?: boolean;
  /** How the groups themselves are laid out.
   *
   *  `stack` is the default because the chooser's usual home is a column inside
   *  something else — a pack's public page, the pre-install step in a sidebar —
   *  where there is no width to spend.
   *
   *  `grid` is for a surface that owns the page. Three groups stacked is three
   *  screens of scrolling for a decision that fits on one, and a group is a
   *  self-contained block with a heading, so side by side reads as well as it
   *  reads down. Single column below 720px either way. */
  layout?: "stack" | "grid";
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  formatSize?: (bytes: number) => string;
  className?: string;
};

/** Below this a bulk control is noise: the gesture it replaces is two clicks,
 *  and a group header that always carries a pair of buttons stops reading as a
 *  heading. A catalogue with an eleven-mod performance group is what makes it
 *  earn its place. */
const BULK_THRESHOLD = 5;

const defaultFormatSize = (bytes: number): string => {
  if (bytes <= 0) return "";
  const mb = bytes / 1_000_000;
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${Math.round(mb)} MB`;
};

export function OptionalChooser({
  groups,
  onToggle,
  onBulkToggle,
  consequences,
  busy = [],
  deferred = [],
  readOnly = false,
  layout = "stack",
  t,
  formatSize = defaultFormatSize,
  className,
}: OptionalChooserProps) {
  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        layout === "grid"
          ? // `auto-fit` rather than a column count, and `items-start` so a
            // two-feature group does not stretch to match a ten-feature one
            // sitting next to it — the gap would then read as a missing card.
            "grid items-start gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(22.5rem,100%),1fr))]"
          : "flex flex-col gap-7",
        className,
      )}
    >
      {groups.map((group) => (
        <GroupBlock
          key={group.id}
          group={group}
          onToggle={onToggle}
          onBulkToggle={onBulkToggle}
          consequences={consequences}
          busy={busy}
          deferred={deferred}
          readOnly={readOnly}
          t={t}
          formatSize={formatSize}
        />
      ))}
    </div>
  );
}

function GroupBlock({
  group,
  onToggle,
  onBulkToggle,
  consequences,
  busy,
  deferred,
  readOnly,
  t,
  formatSize,
}: {
  group: OptionalGroup;
  onToggle?: (featureId: string, enabled: boolean) => void;
  onBulkToggle?: (groupId: string, enabled: boolean) => void;
  consequences?: Record<string, { breaks?: string[]; libraries?: string[] }>;
  busy: string[];
  deferred: string[];
  readOnly: boolean;
  t: OptionalChooserProps["t"];
  formatSize: (bytes: number) => string;
}) {
  const exclusive = group.select === "one" || group.select === "atMostOne";
  const hint =
    group.select === "one"
      ? t("optionalPickOne")
      : group.select === "atMostOne"
        ? t("optionalPickAtMostOne")
        : t("optionalPickAny");

  // A radio group is ONE control: one accessible name, one tab stop, and arrow
  // keys that move the selection. An `any` group is a list of independent
  // switches and must not pretend otherwise — every switch stays tabbable and
  // there is no arrow-key behaviour to implement.
  const groupId = `optional-group-${group.id}`;
  const rovingActive = exclusive && !readOnly;
  const roving = useRoving(
    group.features.length,
    (i) => !!group.features[i]?.enabled,
    (i) => !rovingActive || busy.includes(group.features[i]?.id ?? ""),
  );

  const on = group.features.filter((f) => f.enabled).length;
  const total = group.features.length;
  // A bulk control only makes sense where "all of them at once" is a state the
  // group can actually hold, so exclusive groups never get one however long
  // they grow. Anything mid-flight hides it too: the counts it is drawn from
  // are about to change, and a button that acts on a stale count is worse than
  // no button.
  const bulk =
    !readOnly &&
    !exclusive &&
    !!onBulkToggle &&
    total >= BULK_THRESHOLD &&
    busy.length === 0;

  return (
    <section aria-labelledby={groupId} className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3
            id={groupId}
            className="min-w-0 flex-1 font-display text-[1rem] font-extrabold italic uppercase leading-none tracking-[0.02em] text-txt"
          >
            {group.name}
          </h3>
          {/* The count is the orientation a long group is missing: "8 / 11"
              answers "have I already been through this one?" without reading
              eleven cards. Exclusive groups say nothing — "1 / 3" is the rule
              restated, not information. */}
          {!exclusive && total > 1 && (
            <span className="shrink-0 border border-solid border-line bg-panel px-1.5 py-[2px] font-mono text-[0.65625rem] tabular-nums tracking-[0.08em] text-txt-muted">
              {t("optionalGroupCount", { on, total })}
            </span>
          )}
          {bulk && (
            <span className="flex shrink-0 items-center gap-1">
              <BulkButton
                label={t("optionalAll")}
                disabled={on === total}
                onClick={() => onBulkToggle?.(group.id, true)}
              />
              <BulkButton
                label={t("optionalClear")}
                disabled={on === 0}
                onClick={() => onBulkToggle?.(group.id, false)}
              />
            </span>
          )}
        </div>
        {/* The rule ("pick one") is always stated, in the calm voice of a
            caption; the author's description, when there is one, sits with it
            as the sentence the rule applies to. */}
        <p className="text-[0.78125rem] leading-[1.45] text-txt-muted">
          {group.description ? (
            <>
              {group.description}
              <span className="text-txt-dim"> · {hint}</span>
            </>
          ) : (
            hint
          )}
        </p>
      </header>

      <ul
        role={rovingActive ? "radiogroup" : "list"}
        aria-labelledby={rovingActive ? groupId : undefined}
        className="flex flex-col gap-2"
      >
        {group.features.map((feature, i) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            index={i}
            exclusive={exclusive}
            readOnly={readOnly}
            busy={busy.includes(feature.id)}
            deferred={deferred.includes(feature.id)}
            group={group}
            onToggle={onToggle}
            consequence={consequences?.[feature.id]}
            roving={rovingActive ? roving : null}
            t={t}
            formatSize={formatSize}
          />
        ))}
      </ul>
    </section>
  );
}

/** Deliberately not the `Button` primitive: this sits inside a heading line at
 *  11px, and every Button size starts taller than the text it would sit next
 *  to. A bulk control that outweighs the group name reads as the main action. */
function BulkButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border border-solid border-line px-[0.4375rem] py-[3px]",
        "font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-colors duration-[140ms]",
        disabled
          ? "cursor-default text-txt-muted opacity-50"
          : "cursor-pointer text-txt-muted hover:border-accent-line hover:text-txt",
      )}
    >
      {label}
    </button>
  );
}

function FeatureCard({
  feature,
  index,
  group,
  exclusive,
  readOnly,
  busy,
  deferred,
  onToggle,
  consequence,
  roving,
  t,
  formatSize,
}: {
  feature: OptionalFeature;
  index: number;
  group: OptionalGroup;
  exclusive: boolean;
  readOnly: boolean;
  busy: boolean;
  deferred: boolean;
  onToggle?: (featureId: string, enabled: boolean) => void;
  consequence?: { breaks?: string[]; libraries?: string[] };
  /** Present only in a radio group — see `useRoving`. */
  roving: ReturnType<typeof useRoving> | null;
  t: OptionalChooserProps["t"];
  formatSize: (bytes: number) => string;
}) {
  const size = formatSize(feature.size);
  // `?? []` for the same reason as in the editor: the manifest omits `requires`
  // when empty, and a read-only render of an AUTHORED catalogue (a pack's public
  // page, before any instance has resolved it) hands that document straight in.
  const requiredNames = (feature.requires ?? [])
    .map((id) => group.features.find((f) => f.id === id)?.name ?? id)
    .join(", ");

  // In an `atMostOne` group clicking the selected card clears it; in a `one`
  // group it cannot, because the group must always hold exactly one. Handing
  // the same click through either way and letting the backend decide would make
  // the card look broken in the `one` case, so the UI declines it up front.
  const canClear = group.select !== "one";
  const interactive =
    !readOnly && !busy && (!exclusive || !feature.enabled || canClear);

  const click = () => {
    if (!interactive) return;
    onToggle?.(feature.id, !feature.enabled);
  };

  const on = !!feature.enabled;

  // Chips: every fact that used to share one uppercase mono line gets its own
  // small tag, so "needs Iris" and "turning this off breaks Shaders" read as
  // two different kinds of thing — which they are.
  const chips: React.ReactNode[] = [];
  if (requiredNames) {
    chips.push(
      <Badge key="req" tone="default">
        {t("optionalRequires", { names: requiredNames })}
      </Badge>,
    );
  }
  // Only while the feature is ON: "turning this off breaks X" is advice about
  // an action still available, and repeating it on an already-off card states
  // a consequence that has happened.
  if (on && consequence?.breaks?.length) {
    chips.push(
      <Badge key="breaks" tone="warn">
        {t("optionalBreaks", { names: consequence.breaks.join(", ") })}
      </Badge>,
    );
  }
  if (consequence?.libraries?.length) {
    chips.push(
      <span key="libs" className="font-mono text-[0.65625rem] tracking-[0.06em] text-txt-dim">
        {t("optionalUsesLibrary", { names: consequence.libraries.join(", ") })}
      </span>,
    );
  }

  const content = (
    <>
      {!readOnly && <Indicator on={on} exclusive={exclusive} busy={busy} />}

      <CatalogIcon src={feature.iconUrl ?? undefined} size={44} />

      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 font-display text-[0.875rem] font-bold not-italic uppercase leading-tight tracking-[0.05em] text-txt">
            {feature.name}
          </span>
          {feature.default && (
            <Badge tone="info" className="shrink-0">
              {t("optionalRecommended")}
            </Badge>
          )}
          {feature.activate && (
            <Badge tone="default" className="shrink-0">
              {t(
                feature.activate.kind === "resourcepack"
                  ? "kindResourcepack"
                  : feature.activate.kind === "shaderpack"
                    ? "kindShaderpack"
                    : "kindDatapack",
              )}
            </Badge>
          )}
          {/* Two states worth surfacing before the click, not after: a feature
              declined at install has no bytes on disk, and a config edit made
              while the game is open cannot take effect until it closes. */}
          {on && !feature.installed && (
            <Badge tone="warn" className="shrink-0">
              {t("optionalNeedsDownload")}
            </Badge>
          )}
          {deferred && (
            <Badge tone="warn" className="shrink-0">
              {t("optionalDeferred")}
            </Badge>
          )}
        </span>

        {feature.description && (
          <span className="mt-1 block text-[0.78125rem] leading-[1.45] text-txt-muted">
            {feature.description}
          </span>
        )}

        {chips.length > 0 && (
          <span className="mt-2 flex flex-wrap items-center gap-1.5">{chips}</span>
        )}
      </span>

      {size && (
        <span className="shrink-0 self-start font-mono text-[0.6875rem] tabular-nums tracking-[0.04em] text-txt-dim">
          {size}
        </span>
      )}
    </>
  );

  const shell = cn(
    "flex w-full items-start gap-3.5 border border-solid bg-panel p-3.5 text-left",
    "transition-[border-color,background,opacity] duration-[140ms]",
    on ? "border-accent bg-accent-soft" : "border-line-2",
  );

  if (readOnly) {
    return (
      <li className={cn(shell, !on && "opacity-60")}>
        {content}
        <Badge tone={on ? "info" : "default"} className="shrink-0 self-start">
          {t(feature.default ? "optionalDefaultOn" : "optionalDefaultOff")}
        </Badge>
      </li>
    );
  }

  // One clickable element per card, so the whole card is the target rather than
  // a 22px box. `role="switch"`/`role="radio"` carries the state to a screen
  // reader; the visual control is decorative and marked so.
  //
  // `role="none"` on the <li> when this sits in a radiogroup, and it matters:
  // a radiogroup may only own radios, and an <li>'s implicit `listitem` role in
  // between breaks that ownership — assistive technology then reports a list of
  // one item rather than "option 2 of 4". Stripping the intermediate role makes
  // the button the group's direct child again.
  return (
    <li role={roving ? "none" : undefined}>
      <button
        type="button"
        ref={roving?.setRef(index)}
        role={exclusive ? "radio" : "switch"}
        aria-checked={on}
        aria-disabled={!interactive}
        aria-busy={busy || undefined}
        // A radio group is one tab stop: Tab enters and leaves it, arrows move
        // within. Switches keep the default, since each is its own control.
        tabIndex={roving?.tabIndex(index)}
        onKeyDown={
          roving
            ? (e) =>
                roving.onKeyDown(e, index, (next) => {
                  const target = group.features[next];
                  if (target) onToggle?.(target.id, true);
                })
            : undefined
        }
        onClick={click}
        className={cn(
          shell,
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent-line",
          interactive
            ? cn("cursor-pointer", on ? "hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--panel))]" : "hover:border-accent-line hover:bg-panel-2")
            : "cursor-default",
          busy && "opacity-70",
        )}
      >
        {content}
      </button>
    </li>
  );
}

/** The visual control. `aria-hidden` because the card's button already carries
 *  the role and the checked state — announcing it twice is worse than not
 *  drawing it at all.
 *
 *  Check box for a switch (the `SelectCard` mark), a rotated square for a radio
 *  — the brand's diamond, kept, but at a size and with a filled centre that
 *  reads as "one of these" instead of a stray glyph. While the host is mid-
 *  flight the mark becomes a spinner: the click was heard. */
function Indicator({ on, exclusive, busy }: { on: boolean; exclusive: boolean; busy: boolean }) {
  if (busy) {
    return (
      <span aria-hidden className="grid size-[1.375rem] shrink-0 place-items-center self-start text-accent">
        <Spinner size={14} />
      </span>
    );
  }
  if (exclusive) {
    return (
      <span aria-hidden className="grid size-[1.375rem] shrink-0 place-items-center self-start">
        <span
          className={cn(
            "grid size-[1rem] rotate-45 place-items-center border border-solid transition-[border-color,background] duration-[140ms]",
            on ? "border-accent bg-accent" : "border-line-2 bg-panel-2",
          )}
        >
          <span className={cn("size-[0.375rem]", on ? "bg-accent-ink" : "bg-transparent")} />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[1.375rem] shrink-0 place-items-center self-start border border-solid transition-[border-color,background] duration-[140ms]",
        on ? "border-accent bg-accent text-accent-ink" : "border-line-2 bg-panel-2 text-transparent",
      )}
    >
      <Icon name="check" size={13} />
    </span>
  );
}
