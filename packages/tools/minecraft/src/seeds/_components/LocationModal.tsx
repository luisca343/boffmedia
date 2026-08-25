"use client";

/**
 * LocationModal — everything about one place, with room to read it.
 *
 * A location asks two questions the core keeps apart, and the modal keeps them
 * apart too, as numbered steps:
 *
 *   1. WHERE to look — a pinned point with a tolerance ring, or a band of
 *      distance in some direction. This is the cost knob nobody expects: it
 *      decides how many candidate sites get tried, which is why the count comes
 *      back as `candidatesTried` and is printed here.
 *   2. WHAT must be true there — the conditions. All of them must hold at the
 *      *same* site; that is the sentence the header states outright, because a
 *      list of conditions does not otherwise say whether it means "all" or
 *      "any", and the core means all.
 *
 * The third thing worth being loud about is `hard`: a required location that
 * fails rejects the seed outright, an optional one only lowers its score. That
 * is the difference between "no results at all" and "worse results", and it is
 * the first thing to check when a search finds nothing — so it is a two-option
 * choice with its consequence written next to it, not a bare checkbox.
 *
 * Editing is live, not staged. There is no cancel: the verdict on screen is
 * always the verdict for what is in the boxes, which is the entire point of the
 * editor and would be a lie if edits queued behind an OK button.
 */

import { useState } from "react";
import { Button, Field, Icon, Input, Modal, Select } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import { CONSTRAINTS_BY_GROUP, DIRECTIONS } from "../_spec/vocabulary";
import {
  defaultConstraint,
  latticeAligned,
  latticeDrift,
  type Lattice,
  type UiLocation,
} from "../_spec/model";
import type { LocationResult } from "../_lib/worker/seeds-api";
import { ConstraintRow } from "./ConstraintRow";

export interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  location: UiLocation;
  /** The sampling grid, for the note about sites that cannot land on it. */
  lattice: Lattice;
  siblings: readonly string[];
  biomeOptions: readonly string[];
  result?: LocationResult;
  onChange: (next: UiLocation) => void;
  onRemove: () => void;
  onFocusSite?: (x: number, z: number) => void;
  t: Translate;
}

/** A numbered step heading, so the two questions read as an order rather than a pile. */
function Step({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center bg-accent font-mono text-[10px] font-bold text-accent-ink">
        {n}
      </span>
      <div>
        <h4 className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-txt">
          {title}
        </h4>
        {hint ? <p className="mt-1 text-[11px] leading-snug text-txt-dim">{hint}</p> : null}
      </div>
    </div>
  );
}

export function LocationModal({
  open,
  onClose,
  location,
  lattice,
  siblings,
  biomeOptions,
  result,
  onChange,
  onRemove,
  onFocusSite,
  t,
}: LocationModalProps) {
  const [adding, setAdding] = useState(false);

  // Geometry that cannot put its candidates on a sample point: a diagonal band
  // (the core scales those by 1/sqrt(2)), a ring search, or the ring around a
  // pinned site. Those are measured at the nearest cell, so the site reported
  // is not quite the point read — small, but it is the difference that once
  // had a town passing a forest test while standing on snowy plains.
  const offLattice = !latticeAligned(location, lattice);

  const patch = (part: Partial<UiLocation>) => onChange({ ...location, ...part });

  const passed = result?.constraints.filter((c) => c.pass).length ?? 0;
  const total = location.constraints.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={location.name || t("spec.field.locationName")}
      aside={
        result ? (
          <span
            className={`font-mono text-[10px] uppercase tracking-wide ${
              result.pass ? "text-ok" : "text-danger"
            }`}
          >
            {result.pass ? t("spec.verdict.pass") : t("spec.verdict.fail")}
          </span>
        ) : null
      }
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onRemove} className="mr-auto !text-danger">
            {t("spec.action.removeLocation")}
          </Button>
          {result && onFocusSite ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onFocusSite(result.x, result.z);
                onClose();
              }}
            >
              {t("spec.action.showOnMap")}
            </Button>
          ) : null}
          <Button size="sm" onClick={onClose}>
            {t("spec.action.done")}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        {/* ---------------------------------------------------------- identity */}
        <div className="grid gap-3">
          <Field label={t("spec.field.locationName")} hint={t("spec.field.locationNameHint")}>
            <Input
              value={location.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="font-mono"
            />
          </Field>

          {/* Two labelled options rather than a checkbox: the consequence of
              each is the thing being chosen, and it does not fit in a label. */}
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((hard) => (
              <button
                key={String(hard)}
                type="button"
                onClick={() => patch({ hard })}
                className={`grid gap-1 border p-2.5 text-left transition-colors ${
                  location.hard === hard
                    ? "border-accent bg-panel"
                    : "border-line-2 bg-base hover:border-line"
                }`}
              >
                <span className="font-display text-[12px] font-bold uppercase tracking-[0.04em] text-txt">
                  {hard ? t("spec.field.hard") : t("spec.field.soft")}
                </span>
                <span className="text-[10px] leading-snug text-txt-dim">
                  {hard ? t("spec.field.hardHint") : t("spec.field.softHint")}
                </span>
              </button>
            ))}
          </div>

          {!location.hard ? (
            <Field label={t("spec.field.weight")} hint={t("spec.field.weightHint")}>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={String(location.weight)}
                onChange={(e) => patch({ weight: Number(e.target.value) || 0 })}
                className="w-24"
              />
            </Field>
          ) : null}
        </div>

        {/* ------------------------------------------------------------ where */}
        <div className="grid gap-3 border-t border-line pt-5">
          <Step n={1} title={t("spec.step.where")} hint={t("spec.step.whereHint")} />

          <div className="grid grid-cols-2 gap-2">
            {(["at", "discover"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => patch({ mode })}
                className={`grid gap-1 border p-2.5 text-left transition-colors ${
                  location.mode === mode
                    ? "border-accent bg-panel"
                    : "border-line-2 bg-base hover:border-line"
                }`}
              >
                <span className="font-display text-[12px] font-bold uppercase tracking-[0.04em] text-txt">
                  {mode === "at" ? t("spec.field.modeAt") : t("spec.field.modeDiscover")}
                </span>
                <span className="text-[10px] leading-snug text-txt-dim">
                  {mode === "at" ? t("spec.field.modeAtHint") : t("spec.field.modeDiscoverHint")}
                </span>
              </button>
            ))}
          </div>

          {location.mode === "at" ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label="X">
                <Input
                  type="number"
                  value={String(location.at.x)}
                  onChange={(e) => patch({ at: { ...location.at, x: Number(e.target.value) || 0 } })}
                />
              </Field>
              <Field label="Z">
                <Input
                  type="number"
                  value={String(location.at.z)}
                  onChange={(e) => patch({ at: { ...location.at, z: Number(e.target.value) || 0 } })}
                />
              </Field>
              <Field label={t("spec.field.tolerance")} hint={t("spec.field.toleranceHint")}>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={String(location.at.tolerance)}
                  onChange={(e) =>
                    patch({ at: { ...location.at, tolerance: Number(e.target.value) || 0 } })
                  }
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3">
              <Select
                label={t("spec.field.direction")}
                hint={t("spec.field.directionHint")}
                value={location.discover.direction}
                onChange={(v) => patch({ discover: { ...location.discover, direction: v } })}
                options={[
                  { value: "", label: t("spec.field.anywhere") },
                  ...DIRECTIONS.map((d) => ({ value: d, label: t(`spec.direction.${d}`) })),
                ]}
              />
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("spec.field.distanceMin")}>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={String(location.discover.min)}
                    onChange={(e) =>
                      patch({ discover: { ...location.discover, min: Number(e.target.value) || 0 } })
                    }
                  />
                </Field>
                <Field label={t("spec.field.distanceMax")}>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={String(location.discover.max)}
                    onChange={(e) =>
                      patch({ discover: { ...location.discover, max: Number(e.target.value) || 0 } })
                    }
                  />
                </Field>
                <Field label={t("spec.field.searchStep")} hint={t("spec.field.searchStepHint")}>
                  <Input
                    type="number"
                    min={16}
                    step={100}
                    value={String(location.discover.step)}
                    onChange={(e) =>
                      patch({
                        discover: { ...location.discover, step: Number(e.target.value) || 500 },
                      })
                    }
                  />
                </Field>
              </div>

              {/* How far off the line the site may sit.
                  Perpendicular to the direction, not to X — for a north or
                  south location that is a world-X offset, but for an east or
                  west one it is a Z offset, so the label says "off the axis"
                  rather than naming a coordinate that would be wrong half the
                  time. Empty means the core's own default of ±2000. */}
              {/* Only meaningful with a direction: the band is measured
                  perpendicular to it, and a ring search has no perpendicular. */}
              {location.discover.direction ? (
              <Field label={t("spec.field.lateral")} hint={t("spec.field.lateralHint")}>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  placeholder={t("spec.field.lateralAny")}
                  value={
                    location.discover.xRange
                      ? String(
                          Math.max(
                            Math.abs(location.discover.xRange[0]),
                            Math.abs(location.discover.xRange[1]),
                          ),
                        )
                      : ""
                  }
                  onChange={(e) => {
                    // Written back symmetrically. An imported spec may carry an
                    // asymmetric band and it is preserved as long as nobody
                    // touches this box — editing it is what collapses the band
                    // to ±n, which is the only shape this control can mean.
                    const raw = e.target.value;
                    const n = Math.abs(Number(raw));
                    patch({
                      discover: {
                        ...location.discover,
                        xRange: raw === "" || !Number.isFinite(n) ? null : [-n, n],
                      },
                    });
                  }}
                  className="w-32"
                />
              </Field>
              ) : null}
            </div>
          )}

          {offLattice ? (
            <p className="border border-line-2 bg-base px-2.5 py-2 text-[11px] leading-snug text-txt-dim">
              {t("spec.field.offLattice", { n: latticeDrift(lattice) })}
            </p>
          ) : null}

          {result ? (
            <p className="border border-line-2 bg-base px-2.5 py-2 font-mono text-[11px] text-txt-dim">
              {t("spec.verdict.site", { x: result.x, z: result.z, n: result.candidatesTried })}
            </p>
          ) : null}
        </div>

        {/* ------------------------------------------------------- conditions */}
        <div className="grid gap-3 border-t border-line pt-5">
          <div className="flex items-start justify-between gap-3">
            <Step n={2} title={t("spec.step.conditions")} hint={t("spec.step.conditionsHint")} />
            {total ? (
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-txt-dim">
                {result ? t("spec.step.conditionsMet", { passed, total }) : t("spec.step.conditionsCount", { total })}
              </span>
            ) : null}
          </div>

          {total ? (
            <ul className="grid list-none gap-2 p-0">
              {location.constraints.map((c, i) => (
                <ConstraintRow
                  key={c.id}
                  constraint={c}
                  index={i}
                  siblings={siblings.filter((n) => n !== location.name)}
                  biomeOptions={biomeOptions}
                  // Positional, because the core returns results in the order the
                  // constraints were evaluated — coarse first, then any `fine`
                  // ones appended after. That order is the array's own, so the
                  // index is a real correspondence rather than a guess.
                  result={result?.constraints[i]}
                  onChange={(next) =>
                    patch({ constraints: location.constraints.map((x, j) => (j === i ? next : x)) })
                  }
                  onRemove={() =>
                    patch({ constraints: location.constraints.filter((_, j) => j !== i) })
                  }
                  t={t}
                />
              ))}
            </ul>
          ) : (
            <p className="border border-dashed border-line-2 p-4 text-center text-[12px] text-txt-dim">
              {t("spec.step.noConditions")}
            </p>
          )}

          {adding ? (
            /* Four short lists rather than one of eleven. The groups are the
               questions people arrive with — land and water, room to build,
               biomes, relief — so the right list is obvious before any of the
               names have to be read. */
            <div className="grid gap-3 border border-accent bg-panel p-3">
              <div className="flex items-center justify-between">
                <h5 className="font-display text-[12px] font-bold uppercase tracking-[0.06em] text-txt">
                  {t("spec.action.addConstraint")}
                </h5>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  aria-label={t("spec.action.cancel")}
                  className="grid h-6 w-6 place-items-center text-txt-dim hover:text-txt"
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CONSTRAINTS_BY_GROUP.map(({ group, items }) => (
                  <div key={group} className="grid content-start gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                      {t(`spec.group.${group}`)}
                    </span>
                    {items.map((c) => (
                      <button
                        key={c.type}
                        type="button"
                        onClick={() => {
                          patch({ constraints: [...location.constraints, defaultConstraint(c.type)] });
                          setAdding(false);
                        }}
                        className="border border-line-2 bg-base px-2 py-1.5 text-left text-[12px] text-txt transition-colors hover:border-accent"
                      >
                        {t(`spec.constraint.${c.label}`)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
              {t("spec.action.addConstraint")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
