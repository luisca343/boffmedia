import * as React from "react"

import { cn } from "../cn"
import { Badge } from "../primitives/badge"
import { useRoving } from "../primitives/roving"
import { CatalogIcon } from "./CatalogIcon"
import type { OptionalFeature, OptionalGroup } from "./types"

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
  | "kindResourcepack"
  | "kindShaderpack"
  | "kindDatapack"

export type OptionalChooserProps = {
  groups: OptionalGroup[]
  /** Called with the feature the player touched. The HOST re-renders from what
   *  its backend returns rather than patching the row optimistically: a toggle
   *  is rarely one feature, since a radio group turns its siblings off and
   *  `requires` pulls dependencies on or takes dependents down. */
  onToggle?: (featureId: string, enabled: boolean) => void
  /** Feature ids currently mid-flight, rendered non-interactive. */
  busy?: string[]
  /** Feature ids whose choice is saved but waits for the next launch (D3). */
  deferred?: string[]
  /** No switches, no radios — just what the pack offers. What a public pack
   *  page and the pre-install preview both want. */
  readOnly?: boolean
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
  layout?: "stack" | "grid"
  t: (key: string, values?: Record<string, string | number | Date>) => string
  formatSize?: (bytes: number) => string
  className?: string
}

const defaultFormatSize = (bytes: number): string => {
  if (bytes <= 0) return ""
  const mb = bytes / 1_000_000
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

export function OptionalChooser({
  groups,
  onToggle,
  busy = [],
  deferred = [],
  readOnly = false,
  layout = "stack",
  t,
  formatSize = defaultFormatSize,
  className,
}: OptionalChooserProps) {
  if (groups.length === 0) return null

  return (
    <div
      className={cn(
        layout === "grid"
          ? // `auto-fit` rather than a column count, and `items-start` so a
            // two-feature group does not stretch to match a ten-feature one
            // sitting next to it — the border would then enclose empty space
            // and read as a missing row.
            "grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]"
          : "flex flex-col gap-6",
        className,
      )}
    >
      {groups.map((group) => (
        <GroupBlock
          key={group.id}
          group={group}
          onToggle={onToggle}
          busy={busy}
          deferred={deferred}
          readOnly={readOnly}
          t={t}
          formatSize={formatSize}
        />
      ))}
    </div>
  )
}

function GroupBlock({
  group,
  onToggle,
  busy,
  deferred,
  readOnly,
  t,
  formatSize,
}: {
  group: OptionalGroup
  onToggle?: (featureId: string, enabled: boolean) => void
  busy: string[]
  deferred: string[]
  readOnly: boolean
  t: OptionalChooserProps["t"]
  formatSize: (bytes: number) => string
}) {
  const exclusive = group.select === "one" || group.select === "atMostOne"
  const hint =
    group.select === "one"
      ? t("optionalPickOne")
      : group.select === "atMostOne"
        ? t("optionalPickAtMostOne")
        : t("optionalPickAny")

  // A radio group is ONE control: one accessible name, one tab stop, and arrow
  // keys that move the selection. An `any` group is a list of independent
  // switches and must not pretend otherwise — every switch stays tabbable and
  // there is no arrow-key behaviour to implement.
  const groupId = `optional-group-${group.id}`
  const rovingActive = exclusive && !readOnly
  const roving = useRoving(
    group.features.length,
    (i) => !!group.features[i]?.enabled,
    (i) => !rovingActive || busy.includes(group.features[i]?.id ?? ""),
  )

  return (
    <section aria-labelledby={groupId} className="flex flex-col gap-2">
      <header className="flex flex-col gap-[2px]">
        <h3
          id={groupId}
          className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-txt"
        >
          {group.name}
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-txt-muted">
          {group.description || hint}
        </p>
      </header>

      <ul
        role={rovingActive ? "radiogroup" : "list"}
        aria-labelledby={rovingActive ? groupId : undefined}
        className="flex flex-col border border-solid border-line"
      >
        {group.features.map((feature, i) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            index={i}
            exclusive={exclusive}
            readOnly={readOnly}
            busy={busy.includes(feature.id)}
            deferred={deferred.includes(feature.id)}
            group={group}
            onToggle={onToggle}
            roving={rovingActive ? roving : null}
            t={t}
            formatSize={formatSize}
          />
        ))}
      </ul>
    </section>
  )
}

function FeatureRow({
  feature,
  index,
  group,
  exclusive,
  readOnly,
  busy,
  deferred,
  onToggle,
  roving,
  t,
  formatSize,
}: {
  feature: OptionalFeature
  index: number
  group: OptionalGroup
  exclusive: boolean
  readOnly: boolean
  busy: boolean
  deferred: boolean
  onToggle?: (featureId: string, enabled: boolean) => void
  /** Present only in a radio group — see `useRoving`. */
  roving: ReturnType<typeof useRoving> | null
  t: OptionalChooserProps["t"]
  formatSize: (bytes: number) => string
}) {
  const size = formatSize(feature.size)
  // `?? []` for the same reason as in the editor: the manifest omits `requires`
  // when empty, and a read-only render of an AUTHORED catalogue (a pack's public
  // page, before any instance has resolved it) hands that document straight in.
  const requiredNames = (feature.requires ?? [])
    .map((id) => group.features.find((f) => f.id === id)?.name ?? id)
    .join(", ")

  // In an `atMostOne` group clicking the selected row clears it; in a `one`
  // group it cannot, because the group must always hold exactly one. Handing
  // the same click through either way and letting the backend decide would make
  // the row look broken in the `one` case, so the UI declines it up front.
  const canClear = group.select !== "one"
  const interactive = !readOnly && !busy && (!exclusive || !feature.enabled || canClear)

  const click = () => {
    if (!interactive) return
    onToggle?.(feature.id, !feature.enabled)
  }

  const content = (
    <>
      <CatalogIcon src={feature.iconUrl ?? undefined} size={36} />

      <span className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
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
          {feature.enabled && !feature.installed && (
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
          <span className="text-[12px] leading-snug text-txt-muted">{feature.description}</span>
        )}

        <span className="flex flex-wrap items-center gap-x-3 gap-y-[2px] font-mono text-[11px] uppercase tracking-[0.08em] text-txt-muted">
          {size && <span>{size}</span>}
          {requiredNames && <span>{t("optionalRequires", { names: requiredNames })}</span>}
        </span>
      </span>
    </>
  )

  const shared =
    "flex items-center gap-3 border-b border-solid border-line px-3 py-2 last:border-b-0"

  if (readOnly) {
    return (
      <li className={cn(shared, !feature.enabled && "opacity-60")}>
        {content}
        <Badge tone={feature.enabled ? "info" : "default"} className="shrink-0">
          {t(feature.default ? "optionalDefaultOn" : "optionalDefaultOff")}
        </Badge>
      </li>
    )
  }

  // One clickable element per row, so the whole row is the target rather than a
  // 42px switch. `role="switch"`/`role="radio"` carries the state to a screen
  // reader; the visual control is decorative and marked so.
  //
  // `role="none"` on the <li> when this sits in a radiogroup, and it matters:
  // a radiogroup may only own radios, and an <li>'s implicit `listitem` role in
  // between breaks that ownership — assistive technology then reports a list of
  // one item rather than "option 2 of 4". Stripping the intermediate role makes
  // the button the group's direct child again.
  return (
    <li className={cn(shared, "p-0")} role={roving ? "none" : undefined}>
      <button
        type="button"
        ref={roving?.setRef(index)}
        role={exclusive ? "radio" : "switch"}
        aria-checked={feature.enabled}
        aria-disabled={!interactive}
        // A radio group is one tab stop: Tab enters and leaves it, arrows move
        // within. Switches keep the default, since each is its own control.
        tabIndex={roving?.tabIndex(index)}
        onKeyDown={
          roving
            ? (e) =>
                roving.onKeyDown(e, index, (next) => {
                  const target = group.features[next]
                  if (target) onToggle?.(target.id, true)
                })
            : undefined
        }
        onClick={click}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-left",
          interactive ? "cursor-pointer hover:bg-panel-2" : "cursor-default",
          busy && "opacity-60",
        )}
      >
        {content}
        <Indicator on={feature.enabled} exclusive={exclusive} />
      </button>
    </li>
  )
}

/** The visual control. `aria-hidden` because the row's button already carries
 *  the role and the checked state — announcing it twice is worse than not
 *  drawing it at all. */
function Indicator({ on, exclusive }: { on: boolean; exclusive: boolean }) {
  if (exclusive) {
    return (
      <span
        aria-hidden
        className={cn(
          "relative h-[16px] w-[16px] shrink-0 rotate-45 border border-solid",
          on ? "border-accent bg-accent" : "border-line-2 bg-panel-2",
        )}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-[22px] w-[42px] shrink-0",
        "cut-frame [--cut:6px] [--cut-w:1px]",
        on
          ? "[--cut-line:var(--accent)] [--cut-fill:color-mix(in_srgb,var(--accent)_13%,var(--panel))]"
          : "[--cut-line:var(--line-2)] [--cut-fill:var(--panel-2)]",
      )}
    >
      <i
        className={cn(
          "absolute top-[3px] h-[14px] w-[14px] transition-[left,background] duration-[140ms]",
          "cut [--cut:3px]",
          on ? "left-[22px] bg-accent" : "left-1 bg-txt-muted",
        )}
      />
    </span>
  )
}
