"use client";

/**
 * SpecSettingsModal — the two costs, and the JSON door.
 *
 * These are grouped together because they are the settings nobody edits while
 * tuning a spec and everybody needs once: they belong out of the way, but not
 * out of reach. What they have in common is that both are about *cost*, and
 * the modal states each cost in the units the user will feel it in:
 *
 * - **The scan** sets what one evaluation costs. The grid is quadratic in the
 *   step, so the cell count is printed live rather than left to be discovered
 *   by a slow re-evaluation.
 * - **The prefilter** sets what a *search* costs, and nothing else does. The
 *   meter runs real seeds through it, because a rejection rate is not something
 *   anyone can estimate from a radius and a step.
 *
 * The import path deliberately does not call `parseSpec`. That helper also runs
 * `validateSpec`, which requires a `world.datapacks` this editor does not carry
 * — the stack comes from the pack picker, by design. Only the `//`-stripping is
 * wanted, because the worked example is annotated with comments.
 */

import { useCallback, useState } from "react";
import { Banner, Button, Field, Input, Modal, Select, Textarea, Toggle } from "@boffmedia/ui";

import { saveFile } from "@boffmedia/tool-kit";

import type { Translate } from "@boffmedia/ui/i18n";
import {
  effectiveRadius,
  fromCoreSpec,
  toCoreSpec,
  unsupportedFields,
  type UiSpec,
  type WaterModeName,
  type EngineConstants,
} from "../_spec/model";
import type { PrefilterSample } from "../_lib/worker/seeds-api";

const WATER_MODES: WaterModeName[] = ["biome", "preliminary", "sea_level", "auto", "exact"];

export interface SpecSettingsModalProps {
  open: boolean;
  onClose: () => void;
  spec: UiSpec;
  onChange: (next: UiSpec) => void;
  packIds: readonly string[];
  onTestPrefilter: () => Promise<PrefilterSample | null>;
  t: Translate;
}

export function SpecSettingsModal({
  open,
  onClose,
  spec,
  onChange,
  packIds,
  onTestPrefilter,
  t,
}: SpecSettingsModalProps) {
  const [sample, setSample] = useState<PrefilterSample | null>(null);
  const [testing, setTesting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importDropped, setImportDropped] = useState<string[]>([]);

  const patchScan = (part: Partial<UiSpec["scan"]>) =>
    onChange({ ...spec, scan: { ...spec.scan, ...part } });

  const patchEngineConstants = (part: Partial<EngineConstants>) =>
    onChange({
      ...spec,
      engineConstants: { ...spec.engineConstants, ...part },
    });

  const runTest = useCallback(async () => {
    setTesting(true);
    try {
      setSample(await onTestPrefilter());
    } finally {
      setTesting(false);
    }
  }, [onTestPrefilter]);

  /**
   * Through the host's save flow, never `<a download>`.
   *
   * An anchor click is a no-op inside the launcher's webview: there is no
   * download manager behind it, so the button would appear to work and write
   * nothing. `saveFile` is the seam — an anchor click on the web, a native
   * save dialog writing through Rust in the desktop app.
   */
  const exportSpec = async () => {
    const json = JSON.stringify(toCoreSpec(spec, packIds), null, 2);
    await saveFile({
      suggestedName: "seedspec.json",
      data: new Blob([json], { type: "application/json" }),
      mimeType: "application/json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
  };

  const importSpec = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText.replace(/^\s*\/\/.*$/gm, "")) as Record<string, unknown>;
      if (!parsed.locations || typeof parsed.locations !== "object") {
        throw new Error(t("spec.io.noLocations"));
      }
      // Applied either way; the editor simply cannot hold these fields, and
      // saying so beats letting the next export drop them in silence. The
      // modal stays open when there is something to read.
      const dropped = unsupportedFields(parsed);
      onChange(fromCoreSpec(parsed));
      setImportText("");
      setSample(null);
      setImportDropped(dropped);
      if (!dropped.length) onClose();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    }
  };

  // Off the radius the scan RUNS at, not the one typed: the grid is built from
  // whole cells, and a cell count derived from the raw number would describe a
  // grid nobody samples.
  const radius = effectiveRadius(spec);
  const cells = (Math.floor((radius * 2) / spec.scan.coarseStep) + 1) ** 2;
  const rejection = sample && sample.tested > 0 ? 1 - sample.passed / sample.tested : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("spec.settings.title")}
      footer={
        <Button size="sm" onClick={onClose}>
          {t("spec.action.done")}
        </Button>
      }
    >
      <div className="grid gap-6">
        {/* ----------------------------------------------------------- scan */}
        <section className="grid gap-3">
          <div>
            <h4 className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-txt">
              {t("spec.scan.title")}
            </h4>
            <p className="mt-1.5 text-[11px] leading-snug text-txt-dim">{t("spec.scan.lead")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field
              label={t("spec.scan.radius")}
              hint={radius !== spec.scan.radius ? t("spec.scan.radiusSnapped", { n: radius }) : undefined}
            >
              <Input
                type="number"
                min={500}
                step={spec.scan.coarseStep}
                value={String(spec.scan.radius)}
                onChange={(e) => patchScan({ radius: Number(e.target.value) || 500 })}
              />
            </Field>
            <Field label={t("spec.scan.coarseStep")} hint={t("spec.scan.coarseStepHint")}>
              <Input
                type="number"
                min={16}
                step={16}
                value={String(spec.scan.coarseStep)}
                onChange={(e) => patchScan({ coarseStep: Number(e.target.value) || 16 })}
              />
            </Field>
            <Field label={t("spec.scan.fineStep")} hint={t("spec.scan.fineStepHint")}>
              <Input
                type="number"
                min={1}
                step={1}
                value={String(spec.scan.fineStep)}
                onChange={(e) => patchScan({ fineStep: Number(e.target.value) || 16 })}
              />
            </Field>
          </div>

          <p className="border border-line-2 bg-base px-2.5 py-2 font-mono text-[11px] text-txt-dim">
            {t("spec.scan.cells", { n: cells })}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("spec.scan.originX")}>
              <Input
                type="number"
                value={String(spec.origin.x)}
                onChange={(e) =>
                  onChange({ ...spec, origin: { ...spec.origin, x: Number(e.target.value) || 0 } })
                }
              />
            </Field>
            <Field label={t("spec.scan.originZ")}>
              <Input
                type="number"
                value={String(spec.origin.z)}
                onChange={(e) =>
                  onChange({ ...spec, origin: { ...spec.origin, z: Number(e.target.value) || 0 } })
                }
              />
            </Field>
            <Select
              label={t("spec.scan.water")}
              hint={t("spec.scan.waterHint")}
              value={spec.scan.water}
              onChange={(v) => patchScan({ water: v as WaterModeName })}
              options={WATER_MODES.map((m) => ({ value: m, label: t(`spec.water.${m}`) }))}
            />
          </div>
        </section>

        {/* ------------------------------------------ engine constants */}
        <section className="grid gap-3 border-t border-line pt-5">
          <div>
            <h4 className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-txt">
              {t("spec.settings.engineConstants")}
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("spec.settings.xRange")} hint="±0 to ±5000">
              <Input
                type="number"
                min={0}
                max={5000}
                value={String(spec.engineConstants?.x_range?.[0] ?? 2000)}
                onChange={(e) => {
                  const val = Number(e.target.value) || 2000;
                  patchEngineConstants({ x_range: [val, val] });
                }}
              />
            </Field>
            <Field label={t("spec.settings.directionBiasCone")} hint="0 to 180°">
              <Input
                type="number"
                min={0}
                max={180}
                value={String(spec.engineConstants?.direction_bias_cone ?? 70)}
                onChange={(e) =>
                  patchEngineConstants({ direction_bias_cone: Number(e.target.value) || 70 })
                }
              />
            </Field>
            <Field label={t("spec.settings.radiusDefault")} hint="6000 to 25000">
              <Input
                type="number"
                min={6000}
                max={25000}
                value={String(spec.engineConstants?.radius_default ?? 12096)}
                onChange={(e) =>
                  patchEngineConstants({ radius_default: Number(e.target.value) || 12096 })
                }
              />
            </Field>
          </div>
        </section>

        {/* ------------------------------------------------------ prefilter */}
        <section className="grid gap-3 border-t border-line pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-txt">
                {t("spec.prefilter.title")}
              </h4>
              <p className="mt-1.5 text-[11px] leading-snug text-txt-dim">{t("spec.prefilter.lead")}</p>
            </div>
            {/* A spec may legitimately carry no prefilter — the Teras and
                island presets do not, because theirs cost more hits than it
                bought. Without a switch, `enabled` could only ever be set by
                importing a spec that already had one, leaving the boxes below
                editable and inert. */}
            <Toggle
              on={spec.scan.prefilter.enabled}
              onChange={(on) => patchScan({ prefilter: { ...spec.scan.prefilter, enabled: on } })}
              label={t(spec.scan.prefilter.enabled ? "spec.prefilter.on" : "spec.prefilter.off")}
              className="shrink-0"
            />
          </div>

          <div className="grid grid-cols-3 items-end gap-3">
            <Field label={t("spec.prefilter.radius")}>
              <Input
                type="number"
                min={100}
                step={100}
                disabled={!spec.scan.prefilter.enabled}
                value={String(spec.scan.prefilter.radius)}
                onChange={(e) =>
                  patchScan({
                    prefilter: { ...spec.scan.prefilter, radius: Number(e.target.value) || 100 },
                  })
                }
              />
            </Field>
            <Field label={t("spec.prefilter.step")}>
              <Input
                type="number"
                min={16}
                step={16}
                disabled={!spec.scan.prefilter.enabled}
                value={String(spec.scan.prefilter.step)}
                onChange={(e) =>
                  patchScan({
                    prefilter: { ...spec.scan.prefilter, step: Number(e.target.value) || 64 },
                  })
                }
              />
            </Field>
            <Button
              size="sm"
              variant="ghost"
              onClick={runTest}
              disabled={testing || !spec.scan.prefilter.enabled}
            >
              {testing ? t("spec.prefilter.testing") : t("spec.prefilter.test")}
            </Button>
          </div>

          {sample && rejection !== null ? (
            <div className="grid gap-1.5">
              {/* A bar as well as a number: selectivity is a proportion, and the
                  judgement being made is "most of them" versus "hardly any". */}
              <div className="h-2 w-full bg-line-2">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${Math.round(rejection * 100)}%` }}
                />
              </div>
              <p className="font-mono text-[11px] text-txt-dim">
                {t("spec.prefilter.result", {
                  pct: Math.round(rejection * 100),
                  tested: sample.tested,
                  rate: Math.round(sample.tested / (sample.ms / 1000)),
                })}
              </p>
            </div>
          ) : null}
        </section>

        {/* --------------------------------------------------------- import */}
        <section className="grid gap-3 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-txt">
              {t("spec.io.title")}
            </h4>
            <Button size="sm" variant="ghost" onClick={exportSpec}>
              {t("spec.io.export")}
            </Button>
          </div>

          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder={t("spec.io.placeholder")}
            className="font-mono !text-[11px]"
          />
          {importError ? <Banner tone="error">{importError}</Banner> : null}
          {importDropped.length ? (
            <Banner tone="warn">
              {t("spec.io.dropped", { n: importDropped.length })}
              <span className="mt-1 block font-mono text-[11px]">{importDropped.join(" · ")}</span>
            </Banner>
          ) : null}
          <Button size="sm" variant="ghost" onClick={importSpec} disabled={!importText.trim()}>
            {t("spec.io.apply")}
          </Button>
        </section>
      </div>
    </Modal>
  );
}
