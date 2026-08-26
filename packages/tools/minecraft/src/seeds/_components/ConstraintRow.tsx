"use client";

/**
 * ConstraintRow — one condition, as a card that explains itself.
 *
 * Nothing here knows what `island_feel` is. The card reads `CONSTRAINT_SPECS`
 * and renders whatever fields that type declares, which is what keeps the
 * editor honest as the core's vocabulary changes: a constraint that gains a
 * field gains an input, and one the core does not have cannot be typed at all.
 *
 * Three things are deliberate about the layout:
 *
 * - **The name is a heading, not a dropdown.** Changing a condition's type
 *   throws away every threshold on it, so it is a destructive edit wearing the
 *   clothes of a select. It lives behind "replace" instead; the common case —
 *   reading which condition this is — costs no interaction at all.
 * - **A one-line blurb sits under the name.** "Sensación de isla" does not tell
 *   you it measures a water *fraction*; the blurb does, and it is the
 *   difference between the fields being obvious and being guessed at.
 * - **The verdict is inside the card**, next to the threshold that produced it.
 *   "2.9, needs ≤ 2.5" beside the 2.5 box is a thing you can drag; the same
 *   sentence in a list elsewhere is a thing you can only read.
 */

import { Button, Icon, Input, Select } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import { CONSTRAINT_BY_TYPE, DIRECTIONS, type FieldSpec, type BandSpec } from "../_spec/vocabulary";
import type { UiConstraint } from "../_spec/model";
import type { ConstraintResult } from "../_lib/worker/seeds-api";

export interface ConstraintRowProps {
  constraint: UiConstraint;
  index: number;
  /** Names of the other locations, for `land_connected_to`. */
  siblings: readonly string[];
  /** Every biome the loaded stack can place, plus the tags worth offering. */
  biomeOptions: readonly string[];
  result?: ConstraintResult;
  onChange: (next: UiConstraint) => void;
  onRemove: () => void;
  t: Translate;
}

/**
 * `1e9` is not a number the world produced. The core's `round4` substitutes it
 * for a genuine `Infinity` so a result stays JSON-safe, and printing it raw is
 * what turns "no warm ocean anywhere near here" into "1000000000" — which reads
 * as a measurement rather than as an absence.
 */
const INFINITE = 1e9;

function formatValue(value: number, kind: string | undefined): string {
  if (!Number.isFinite(value) || Math.abs(value) >= INFINITE) return value < 0 ? "−∞" : "∞";
  if (kind === "count") return String(value);
  if (kind === "fraction") return value.toFixed(2);
  if (kind === "area") {
    // Areas run to tens of millions of blocks²; the digits past the first three
    // are noise nobody is tuning against.
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  }
  return String(Math.round(value));
}

/**
 * Message key for the unit shown after a numeric box, so a bare number never
 * has to be interpreted. Returns a key rather than a word — the unit is UI
 * copy and belongs in the catalog with everything else.
 */
function unitKeyFor(kind: string): string | null {
  if (kind === "blocks" || kind === "area" || kind === "height") return `spec.unit.${kind}`;
  return null;
}

export function ConstraintRow({
  constraint,
  index,
  siblings,
  biomeOptions,
  result,
  onChange,
  onRemove,
  t,
}: ConstraintRowProps) {
  const spec = CONSTRAINT_BY_TYPE.get(constraint.type);

  const setValue = (key: string, value: number | string | boolean | string[] | BandSpec) => {
    onChange({ ...constraint, values: { ...constraint.values, [key]: value } });
  };

  const renderField = (f: FieldSpec) => {
    const raw = constraint.values[f.key];
    const label = t(`spec.field.${f.label}`);

    if (f.kind === "flag") {
      return (
        <label
          key={f.key}
          className="col-span-2 flex items-center gap-2 border border-line-2 bg-panel px-2.5 py-2 text-[12px] text-txt-muted"
        >
          <input
            type="checkbox"
            checked={raw === true}
            onChange={(e) => setValue(f.key, e.target.checked)}
            className="accent-accent"
          />
          <span>{label}</span>
          <span className="ml-auto text-[10px] text-txt-dim">{t("spec.field.fineHint")}</span>
        </label>
      );
    }

    if (f.kind === "biomes") {
      const list = Array.isArray(raw) ? raw : [];
      return (
        <div key={f.key} className="col-span-2 grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wide text-txt-dim">{label}</span>
          {list.length ? (
            <div className="flex flex-wrap gap-1">
              {list.map((id, i) => (
                <span
                  key={`${id}-${i}`}
                  className="flex items-center gap-1.5 border border-line-2 bg-panel py-1 pl-2 pr-1 font-mono text-[11px] text-txt"
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => setValue(f.key, list.filter((_, j) => j !== i))}
                    className="grid h-4 w-4 place-items-center text-txt-dim transition-colors hover:text-danger"
                    aria-label={t("spec.action.removeBiome")}
                  >
                    <Icon name="x" size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] italic text-txt-dim">{t("spec.field.noBiomes")}</p>
          )}
          <Select
            value=""
            onChange={(v) => {
              // Silently ignoring a duplicate rather than warning: adding the
              // same selector twice is a slip, not a decision worth a dialog.
              if (v && !list.includes(v)) setValue(f.key, [...list, v]);
            }}
            options={[
              { value: "", label: t("spec.action.addBiome") },
              ...biomeOptions.filter((b) => !list.includes(b)).map((b) => ({ value: b, label: b })),
            ]}
          />
        </div>
      );
    }

    if (f.kind === "direction") {
      return (
        <Select
          key={f.key}
          label={label}
          value={typeof raw === "string" ? raw : ""}
          onChange={(v) => setValue(f.key, v)}
          options={[
            { value: "", label: t("spec.field.anyDirection") },
            ...DIRECTIONS.map((d) => ({ value: d, label: t(`spec.direction.${d}`) })),
          ]}
        />
      );
    }

    if (f.kind === "location") {
      return (
        <Select
          key={f.key}
          label={label}
          value={typeof raw === "string" ? raw : ""}
          onChange={(v) => setValue(f.key, v)}
          options={[
            { value: "", label: t("spec.field.pickLocation") },
            ...siblings.map((n) => ({ value: n, label: n })),
          ]}
        />
      );
    }

    const unitKey = unitKeyFor(f.kind);

    // Band field rendering (soft-band support for min/ideal/ideal_max/max)
    if (f.band) {
      const bandValue = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<BandSpec>;
      const maxVal = f.max ?? 20000;
      const minWidth = Math.max(5, (bandValue.min ?? 0) / maxVal * 100);
      const idealStart = bandValue.ideal ?? 0;
      const idealEnd = bandValue.ideal_max ?? idealStart;
      const idealWidth = Math.max(5, (idealEnd - idealStart) / maxVal * 100);
      const maxStart = bandValue.max ?? maxVal;
      const maxWidth = Math.max(5, (maxVal - maxStart) / maxVal * 100);

      return (
        <div key={f.key} className="col-span-2 grid gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide text-txt-dim">{label}</span>

          {/* Band visualization */}
          <div className="flex h-6 gap-1 rounded border border-line-2 bg-panel p-1">
            <div className="flex-1 flex gap-0.5">
              {/* Hard fail zone (below min) */}
              {bandValue.min !== undefined && (
                <div className="h-full bg-danger/20 rounded-sm" style={{ flex: `0 0 ${minWidth}%` }} />
              )}
              {/* Soft band zone */}
              {bandValue.ideal !== undefined && (
                <div className="h-full bg-warning/20 rounded-sm" style={{ flex: `0 0 ${idealWidth}%` }} />
              )}
              {/* Hard fail zone (above max) */}
              {bandValue.max !== undefined && bandValue.ideal_max !== undefined && (
                <div className="h-full bg-danger/20 rounded-sm" style={{ flex: `0 0 ${maxWidth}%` }} />
              )}
              <div className="flex-1" />
            </div>
          </div>

          {/* Sliders for band fields - order: min, ideal, ideal_max, max */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {/* min slider */}
            <div className="grid gap-1">
              <span className="text-[10px] text-txt-dim">min</span>
              <Input
                type="number"
                value={bandValue.min ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue(f.key, { ...bandValue, min: n });
                }}
                className="!py-1 !text-[11px]"
              />
            </div>

            {/* ideal slider */}
            <div className="grid gap-1">
              <span className="text-[10px] text-txt-dim">ideal</span>
              <Input
                type="number"
                value={bandValue.ideal ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue(f.key, { ...bandValue, ideal: n });
                }}
                className="!py-1 !text-[11px]"
              />
            </div>

            {/* ideal_max slider */}
            <div className="grid gap-1">
              <span className="text-[10px] text-txt-dim">ideal_max</span>
              <Input
                type="number"
                value={bandValue.ideal_max ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue(f.key, { ...bandValue, ideal_max: n });
                }}
                className="!py-1 !text-[11px]"
              />
            </div>

            {/* max slider */}
            <div className="grid gap-1">
              <span className="text-[10px] text-txt-dim">max</span>
              <Input
                type="number"
                value={bandValue.max ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue(f.key, { ...bandValue, max: n });
                }}
                className="!py-1 !text-[11px]"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={f.key} className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wide text-txt-dim">{label}</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={typeof raw === "number" ? String(raw) : ""}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={(e) => {
              const n = Number(e.target.value);
              // An empty box is left empty rather than snapped to 0: 0 is a real
              // threshold for most of these, so substituting it would quietly
              // change the spec while the user is mid-keystroke.
              setValue(f.key, e.target.value === "" ? "" : Number.isFinite(n) ? n : 0);
            }}
            className="flex-1 !py-2 !text-[13px]"
          />
          {unitKey ? (
            <span className="w-14 shrink-0 font-mono text-[10px] text-txt-dim">{t(unitKey)}</span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <li className="grid gap-3 border border-line-2 bg-base p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center bg-line-2 font-mono text-[10px] text-txt-muted">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {/* A type outside the vocabulary has no label and no blurb to look
              up; naming it raw beats rendering the missing key itself, which
              is what `spec.constraint.` resolves to. */}
          <h5 className="font-display text-[13px] font-bold uppercase leading-tight tracking-[0.04em] text-txt">
            {spec ? t(`spec.constraint.${spec.label}`) : constraint.type}
          </h5>
          <p className="mt-0.5 text-[11px] leading-snug text-txt-dim">
            {spec ? t(`spec.blurb.${spec.label}`) : t("spec.constraint.unknown")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title={t("spec.action.removeConstraint")}
          aria-label={t("spec.action.removeConstraint")}
          className="grid h-6 w-6 shrink-0 place-items-center text-txt-dim transition-colors hover:text-danger"
        >
          <Icon name="x" size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">{spec?.fields.map(renderField)}</div>

      {result ? (
        <p
          className={`flex items-baseline gap-2 border-t border-line-2 pt-2 font-mono text-[11px] leading-snug ${
            result.pass ? "text-ok" : "text-danger"
          }`}
        >
          <span className="shrink-0 font-bold">{result.pass ? "✓" : "✗"}</span>
          <span className="shrink-0">{formatValue(result.value, spec?.valueKind)}</span>
          {result.detail ? <span className="text-txt-dim">{result.detail}</span> : null}
        </p>
      ) : null}
    </li>
  );
}
