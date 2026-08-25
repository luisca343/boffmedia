"use client";

/**
 * SpecPanel — the spec at a glance; the editing happens in modals.
 *
 * The panel answers two questions and refuses the rest: *what am I asking for*,
 * and *does this seed satisfy it*. Everything editable — a location's position,
 * its conditions, the scan, the prefilter, the JSON — opens in a modal, because
 * a 380px column cannot show eleven constraint types with their fields without
 * turning into a scroll well where nothing can be compared to anything.
 *
 * What survives here is the summary line per location and the overall verdict.
 * That is also the honest reading order: you look at the sidebar to see *which*
 * location is failing, and open that one.
 *
 * The unvalidated warning sits at the top rather than the bottom. A verdict
 * list looks more authoritative than a map does — it is a machine saying yes or
 * no — so the caveat has to arrive before the answer, not after it.
 */

import { useCallback, useMemo, useState } from "react";
import { Banner, Button, Field, Panel, Select, Spinner } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import { PRESETS } from "../_spec/presets";
import { defaultLocation, fromCoreSpec, latticeOf, type UiSpec } from "../_spec/model";
import type { PrefilterSample, SpecEvalResult } from "../_lib/worker/seeds-api";
import { LocationRow } from "./LocationRow";
import { LocationModal } from "./LocationModal";
import { SpecSettingsModal } from "./SpecSettingsModal";

/** Tags worth offering above the raw biome list — the ones the specs actually use. */
const COMMON_TAGS = [
  "#minecraft:is_ocean",
  "#minecraft:is_forest",
  "#minecraft:is_beach",
  "#minecraft:is_mountain",
  "#minecraft:is_jungle",
  "#minecraft:is_taiga",
  "#minecraft:is_savanna",
  "#minecraft:is_badlands",
  "#minecraft:is_hill",
  "#minecraft:is_river",
];

export interface SpecPanelProps {
  spec: UiSpec;
  onChange: (next: UiSpec) => void;
  /** Every biome the loaded stack can place. Empty until the stack lands. */
  biomeIds: readonly string[];
  result: SpecEvalResult | null;
  evaluating: boolean;
  error: string | null;
  /** The seed the verdict refers to — always the one on the map. */
  seedLabel: string;
  /** Pack ids in load order, for the exported spec's derived `world`. */
  packIds: readonly string[];
  onFocusSite?: (x: number, z: number) => void;
  onTestPrefilter: () => Promise<PrefilterSample | null>;
  t: Translate;
}

export function SpecPanel({
  spec,
  onChange,
  biomeIds,
  result,
  evaluating,
  error,
  seedLabel,
  packIds,
  onFocusSite,
  onTestPrefilter,
  t,
}: SpecPanelProps) {
  // The open location is tracked by id, not by index: an edit that removes an
  // earlier card would otherwise slide a different location under the modal.
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const biomeOptions = useMemo(() => [...COMMON_TAGS, ...biomeIds], [biomeIds]);
  const names = useMemo(() => spec.locations.map((l) => l.name).filter(Boolean), [spec.locations]);

  const openIndex = spec.locations.findIndex((l) => l.id === openId);
  const openLocation = openIndex >= 0 ? spec.locations[openIndex] : null;

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setOpenId(null);
    onChange(fromCoreSpec(preset.spec));
  };

  const addLocation = useCallback(() => {
    const next = defaultLocation(`site_${spec.locations.length + 1}`);
    onChange({ ...spec, locations: [...spec.locations, next] });
    // Opened immediately: a new location has no conditions, so leaving it
    // closed would add a row that means nothing and explains nothing.
    setOpenId(next.id);
  }, [spec, onChange]);

  return (
    <>
      <Panel
        title={t("spec.title")}
        aside={
          evaluating ? (
            <Spinner size={14} />
          ) : result ? (
            <span
              className={`font-mono text-[10px] uppercase tracking-wide ${
                result.pass ? "text-ok" : "text-danger"
              }`}
            >
              {result.pass ? t("spec.verdict.seedPass") : t("spec.verdict.seedFail")}
            </span>
          ) : null
        }
      >
        <div className="grid gap-3">
          <p className="text-[11px] leading-snug text-txt-dim">{t("spec.lead")}</p>

          <Field label={t("spec.field.preset")}>
            <Select
              value=""
              onChange={applyPreset}
              options={[
                { value: "", label: t("spec.action.pickPreset") },
                ...PRESETS.map((p) => ({ value: p.id, label: t(`spec.preset.${p.label}`) })),
              ]}
            />
          </Field>

          {error ? <Banner tone="error">{error}</Banner> : null}

          {result ? (
            <p className="border border-line-2 bg-base px-2.5 py-2 font-mono text-[10px] leading-relaxed text-txt-dim">
              {t("spec.verdict.against", { seed: seedLabel })}
              <br />
              {t("spec.verdict.total", { score: result.score.toFixed(2) })}
            </p>
          ) : null}

          <div className="grid gap-1.5">
            {spec.locations.map((loc) => (
              <LocationRow
                key={loc.id}
                location={loc}
                result={result?.locations[loc.name]}
                onOpen={() => setOpenId(loc.id)}
                t={t}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" onClick={addLocation}>
              {t("spec.action.addLocation")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
              {t("spec.settings.open")}
            </Button>
          </div>
        </div>
      </Panel>

      {openLocation ? (
        <LocationModal
          open
          onClose={() => setOpenId(null)}
          location={openLocation}
          lattice={latticeOf(spec)}
          siblings={names}
          biomeOptions={biomeOptions}
          result={result?.locations[openLocation.name]}
          onChange={(next) =>
            onChange({
              ...spec,
              locations: spec.locations.map((x) => (x.id === next.id ? next : x)),
            })
          }
          onRemove={() => {
            onChange({ ...spec, locations: spec.locations.filter((x) => x.id !== openLocation.id) });
            setOpenId(null);
          }}
          onFocusSite={onFocusSite}
          t={t}
        />
      ) : null}

      <SpecSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        spec={spec}
        onChange={onChange}
        packIds={packIds}
        onTestPrefilter={onTestPrefilter}
        t={t}
      />
    </>
  );
}
