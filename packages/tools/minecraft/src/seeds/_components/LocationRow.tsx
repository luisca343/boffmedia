"use client";

/**
 * LocationRow — one location as a line in the sidebar, not a form.
 *
 * The sidebar's job is to answer "what am I asking for, and is this seed it?"
 * at a glance. Everything editable lives in `LocationModal`; what stays here is
 * the three facts worth seeing without opening anything: whether the location
 * is required, how many of its conditions hold, and where it resolved to.
 *
 * `2/3` is the number that earns its place. A location that fails tells you
 * nothing about how close it was — one condition short of passing looks
 * identical to none of them holding, and the two call for completely different
 * edits.
 */

import { Icon } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import type { UiLocation } from "../_spec/model";
import type { LocationResult } from "../_lib/worker/seeds-api";

export interface LocationRowProps {
  location: UiLocation;
  result?: LocationResult;
  onOpen: () => void;
  t: Translate;
}

export function LocationRow({ location, result, onOpen, t }: LocationRowProps) {
  const total = location.constraints.length;
  const passed = result?.constraints.filter((c) => c.pass).length ?? 0;

  // Three states, not two: "not evaluated yet" is not a failure, and colouring
  // it like one would make a loading world look like a rejected seed.
  const tone = !result
    ? "border-line-2"
    : result.pass
      ? "border-l-ok border-line-2"
      : "border-l-danger border-line-2";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`grid w-full gap-1.5 border border-l-[3px] bg-base p-2.5 text-left transition-colors hover:border-line hover:bg-panel ${tone}`}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[0.75rem] text-txt">
          {location.name || t("spec.field.locationName")}
        </span>
        {!location.hard ? (
          <span className="shrink-0 border border-line-2 px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wide text-txt-dim">
            {t("spec.field.soft")}
          </span>
        ) : null}
        <Icon name="chevronRight" size={13} className="shrink-0 text-txt-dim" />
      </div>

      <div className="flex items-center gap-2 font-mono text-[0.625rem] text-txt-dim">
        <span className={result && !result.pass ? "text-danger" : undefined}>
          {result
            ? t("spec.step.conditionsMet", { passed, total })
            : t("spec.step.conditionsCount", { total })}
        </span>
        {result ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              {result.x}, {result.z}
            </span>
          </>
        ) : null}
      </div>
    </button>
  );
}
