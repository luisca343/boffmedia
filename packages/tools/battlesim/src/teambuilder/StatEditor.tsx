"use client";

/**
 * Nature, EVs/SP and IVs for one set.
 *
 * The budget is the FORMAT's, not a constant: `statLimitsFor(format)` says how
 * many points there are, how many fit on one stat, what the step is, and
 * whether IVs and level are the builder's to set at all. Standard formats spend
 * 510 EVs in steps of 4, 252 per stat; Pokémon Champions spends 66 Stat Points
 * in steps of 1, 32 per stat, always at level 50 with 31 IVs.
 *
 * Going over the budget WARNS — it never takes points from another stat,
 * because a builder who typed 252 into Speed did not ask for Attack to change.
 *
 * Natures come from the dex (`Dex.natures.all()`), with the stats each one
 * moves in the label; the old hand-typed list had eleven natures that do not
 * exist and four that do missing.
 *
 * IVs sit behind "Advanced" — 31 is right for everyone until it is not, and a
 * 0 for a Trick Room sweeper parses. In a format that locks them there is
 * nothing to disclose, so the disclosure is replaced by the one line that says
 * so.
 */

import * as React from "react";
import { Dex } from "@pkmn/dex";
import { calcStat, statLimitsFor } from "@boffmedia/battle-core";
import type { PokemonSet } from "@pkmn/sim";
import { cn, Disclosure, Slider } from "@boffmedia/ui";
import { DkSelect } from "@boffmedia/ui/datakit";

import { useToolT } from "../i18n";
import { STAT_IDS, TB_NS, canonicalNature, type StatId, type TbLabels } from "./labels";
import { TbKicker, TbMeter, TbNumInput, TbSpBar } from "./tb-kit";

type StatsTable = Record<StatId, number>;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function StatEditor({
  set,
  base,
  format,
  labels,
  onChange,
}: {
  set: PokemonSet;
  /** The species' base stats, or null when the slot has no species yet. */
  base: StatsTable | null;
  /** The team's format — it owns the budget, the caps and the step. */
  format: string;
  labels: TbLabels;
  onChange: (patch: Partial<PokemonSet>) => void;
}) {
  const t = useToolT(TB_NS);
  const limits = React.useMemo(() => statLimitsFor(format), [format]);
  const sp = limits.system === "sp";
  const nature = canonicalNature(set.nature);
  const natureInfo = Dex.natures.get(nature);
  const evs = set.evs as StatsTable;
  const ivs = set.ivs as StatsTable;
  const total = STAT_IDS.reduce((sum, s) => sum + (evs[s] || 0), 0);
  const remaining = limits.total - total;
  const over = remaining < 0;

  // "EVs" and "SP" are two different currencies, so they get two different
  // words everywhere they show: the kicker, the column head, the remainder and
  // every slider's accessible name.
  const budgetLabel = sp ? t("set.sp") : t("set.evs");
  const pointsAria = (stat: StatId) => (sp ? t("set.spAria", { stat: labels.stat(stat) }) : t("set.evAria", { stat: labels.stat(stat) }));
  const remainderText = over
    ? sp
      ? t("set.spOver", { n: -remaining })
      : t("set.over", { n: -remaining })
    : sp
      ? t("set.spRemaining", { n: remaining })
      : t("set.remaining", { n: remaining });

  const natureOptions = React.useMemo(
    () =>
      Dex.natures
        .all()
        .filter((n) => n.exists)
        .map((n) => ({ value: n.name, label: labels.nature(n.name) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [labels],
  );

  const setEv = (stat: StatId, raw: number) => {
    const v = clamp(Number.isNaN(raw) ? 0 : raw, 0, limits.perStat);
    onChange({ evs: { ...evs, [stat]: v } });
  };
  const setIv = (stat: StatId, raw: number) => {
    // `parseInt(v) || 31` made 0 impossible: 0 is falsy. NaN is the only value
    // that means "nothing typed".
    const v = clamp(Number.isNaN(raw) ? 31 : raw, 0, 31);
    onChange({ ivs: { ...ivs, [stat]: v } });
  };

  return (
    <div className="grid gap-4">
      {/* nature */}
      <div className="grid gap-[7px]">
        <TbKicker>{t("set.nature")}</TbKicker>
        <DkSelect value={nature} options={natureOptions} onChange={(v) => onChange({ nature: v })} ariaLabel={t("set.nature")} className="max-w-none" />
      </div>

      {/* budget */}
      <div className="grid gap-[7px]">
        <div className="flex items-center gap-3">
          <TbKicker>{budgetLabel}</TbKicker>
          <span className="flex-1" />
          <span
            className={cn("font-mono text-[11px]/none font-semibold tabular-nums", over ? "text-bad" : total === limits.total ? "text-ok" : "text-txt-muted")}
            aria-live="polite"
          >
            {total} / {limits.total} · {remainderText}
          </span>
        </div>
        <TbMeter value={total} max={limits.total} />
      </div>

      {/* point rows */}
      <div role="group" aria-label={sp ? t("set.spName") : t("set.evs")} className="grid gap-[6px]">
        <div className="grid grid-cols-[52px_minmax(0,1fr)_64px_46px] items-center gap-x-[10px] px-px font-mono text-[9px]/none font-semibold uppercase tracking-[0.06em] text-txt-dim">
          <span />
          <span />
          <span className="text-right">{budgetLabel}</span>
          <span className="text-right">{t("set.final")}</span>
        </div>
        {STAT_IDS.map((stat) => {
          const plus = natureInfo.exists && natureInfo.plus === stat;
          const minus = natureInfo.exists && natureInfo.minus === stat;
          const ev = evs[stat] || 0;
          const final = base ? calcStat(format, stat, base[stat], ivs[stat] ?? 31, ev, set.level || 100, nature) : null;
          return (
            <div key={stat} className="grid grid-cols-[52px_minmax(0,1fr)_64px_46px] items-center gap-x-[10px]">
              <span className={cn("inline-flex items-center gap-1 font-mono text-[11px]/none font-bold uppercase tracking-[0.06em]", plus ? "text-ok" : minus ? "text-bad" : "text-txt-muted")}>
                {labels.statShort(stat)}
                {plus && <span aria-label="+">▲</span>}
                {minus && <span aria-label="−">▼</span>}
              </span>
              {/* EV formats use the slider; SP formats use the segmented bar. */}
              {sp ? (
                <TbSpBar
                  stat={stat}
                  currentSp={ev}
                  perStat={limits.perStat}
                  remainingBudget={remaining}
                  nature={nature}
                  base={base?.[stat] ?? 0}
                  format={format}
                  onChange={(v) => setEv(stat, v)}
                  ariaLabel={pointsAria(stat)}
                  valueText={(n) => t("set.spBarSegmentAria", { current: n, max: limits.perStat, stat: labels.stat(stat) })}
                  bumpHint={(n) => t("set.spBarBumpLabel", { n })}
                />
              ) : (
                <Slider
                  value={ev}
                  min={0}
                  max={limits.perStat}
                  step={limits.step}
                  onChange={(v) => setEv(stat, v)}
                  ariaLabel={pointsAria(stat)}
                  className="[&>output]:hidden"
                />
              )}
              <TbNumInput
                min={0}
                max={limits.perStat}
                step={limits.step}
                value={ev}
                aria-label={pointsAria(stat)}
                onChange={(e) => setEv(stat, parseInt(e.target.value, 10))}
              />
              <output className={cn("text-right font-mono text-[13px]/none font-semibold tabular-nums", plus ? "text-ok" : minus ? "text-bad" : "text-txt")}>
                {final ?? "—"}
              </output>
            </div>
          );
        })}
      </div>

      {/* IVs — editable, or the one line that says why not */}
      {limits.lockedIvs !== null ? (
        <p className="m-0 font-body text-[12px] leading-[1.45] text-txt-dim">{t("set.ivsLocked", { n: limits.lockedIvs })}</p>
      ) : (
        <Disclosure title={t("set.advanced")} sub={t("set.ivs")}>
          <div role="group" aria-label={t("set.ivs")} className="grid grid-cols-3 gap-x-3 gap-y-2 pt-3 max-[480px]:grid-cols-2">
            {STAT_IDS.map((stat) => (
              <label key={stat} className="grid gap-[5px]">
                <TbKicker>{labels.statShort(stat)}</TbKicker>
                <TbNumInput
                  min={0}
                  max={31}
                  value={ivs[stat] ?? 31}
                  aria-label={t("set.ivAria", { stat: labels.stat(stat) })}
                  onChange={(e) => setIv(stat, parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </label>
            ))}
          </div>
        </Disclosure>
      )}
    </div>
  );
}
