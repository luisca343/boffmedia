"use client";

/**
 * One Pokémon set, edited in place — the centre pane of the team editor.
 *
 * ≥1024: species card (sprite, types, base stats, ability, item) beside the
 * four move rows; below them the level / gender / shiny / Tera row and the
 * stat editor. Narrower, the two columns stack. Every choice that has more
 * than a handful of options goes through the one `Picker`; the choices that
 * do not (ability, gender, Tera type) are chips, so the legal options are all
 * on screen and one click away.
 *
 * Follows the Showdown flow: picking a species moves focus to the ability,
 * the item to the first move, a move to the next move. A set is four keystroke
 * bursts and four Enters.
 */

import * as React from "react";
import { Dex } from "@pkmn/dex";
import { statLimitsFor } from "@boffmedia/battle-core";
import type { PokemonSet } from "@pkmn/sim";
import { Button, Checkbox, cn, Icon } from "@boffmedia/ui";
import { DkEmpty } from "@boffmedia/ui/datakit";
import { handleSpriteError } from "@boffmedia/tools-pokemon";

import { BsimSection, BSIM_FOCUS_CUT } from "../components/bsim-kit";
import { BxTypeRow } from "../components/bx-kit";
import { useToolT } from "../i18n";
import { STAT_IDS, TB_NS, TYPE_LIST, canonicalGender, canonicalNature, canonicalType, toId, useTbLabels, type StatId } from "./labels";
import { Picker, PICKER_TRIGGER, type PickerKind } from "./Picker";
import { withSetDefaults } from "./set-defaults";
import { StatEditor } from "./StatEditor";
import { useLegalMoves, useLegalSpecies } from "./useTeamValidation";
import { itemIconStyle, speciesSprite, TbIconAction, TbKicker, TbMoveRow, TbNumInput, TbSegChoice, TbStatBar, TbTypeChip, usePop, type TbMoveInfo } from "./tb-kit";

const CAT_KEY: Record<string, string> = { Physical: "phys", Special: "spec", Status: "status" };

type PickerState = { kind: PickerKind; moveIdx?: number } | null;

export interface SetEditorProps {
  set: PokemonSet;
  slotIndex: number;
  /** The team's format. Decides the move pool, the point budget, IVs and level. */
  format: string;
  onChange: (next: PokemonSet) => void;
  /** Rendered in the species card's header. */
  actions?: React.ReactNode;
}

export function SetEditor({ set: rawSet, slotIndex, format, onChange, actions }: SetEditorProps) {
  const t = useToolT(TB_NS);
  const labels = useTbLabels();
  const set = withSetDefaults(rawSet);
  const speciesData = set.species ? Dex.species.get(set.species) : null;
  const sp = speciesData?.exists ? speciesData : null;
  const limits = React.useMemo(() => statLimitsFor(format), [format]);

  const [picker, setPicker] = React.useState<PickerState>(null);
  // The move pool for THIS species in THIS regulation, from the pooled worker:
  // the authoritative answer needs the modded dex, which is far too heavy to
  // pull onto the main thread. `known: false` means the picker shows everything.
  const legalMoves = useLegalMoves(format, sp?.name ?? "");
  const legal = legalMoves.known ? legalMoves.moves : null;
  // The regulation's roster. Asked once per format for the whole editor — the
  // pooled worker caches it, so all six slots share one answer.
  const legalSpecies = useLegalSpecies(format);
  const roster = legalSpecies.known ? legalSpecies.species : null;
  const abilityRef = React.useRef<HTMLDivElement>(null);
  const itemRef = React.useRef<HTMLButtonElement>(null);
  const moveRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const levelRef = React.useRef<HTMLInputElement>(null);
  const speciesPop = usePop(sp?.id);

  const update = (patch: Partial<PokemonSet>) => onChange(withSetDefaults({ ...set, ...patch }));

  // After the Modal restores focus to the trigger, move on to the next control.
  const focusLater = (el: HTMLElement | null | undefined) => {
    setTimeout(() => el?.focus(), 30);
  };

  const pickSpecies = (id: string) => {
    const next = Dex.species.get(id);
    if (!next.exists) return;
    const abilities = Object.values(next.abilities).filter(Boolean) as string[];
    const keepAbility = abilities.some((a) => toId(a) === toId(set.ability));
    update({
      species: next.name,
      name: "",
      ability: keepAbility ? set.ability : abilities[0] ?? "",
      gender: next.gender ? next.gender : canonicalGender(set.gender),
      teraType: canonicalType(set.teraType) || next.types[0],
    });
    setPicker(null);
    focusLater(abilityRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') ?? abilityRef.current?.querySelector<HTMLElement>('[role="radio"]'));
  };

  const pickAbility = (id: string) => {
    update({ ability: Dex.abilities.get(id).name });
    setPicker(null);
    focusLater(itemRef.current);
  };

  const pickItem = (id: string) => {
    update({ item: Dex.items.get(id).name });
    setPicker(null);
    focusLater(moveRefs.current[0]?.querySelector("button"));
  };

  const pickMove = (idx: number, id: string) => {
    const moves = [...set.moves];
    moves[idx] = Dex.moves.get(id).name;
    update({ moves });
    setPicker(null);
    const nextEmpty = moves.findIndex((m, i) => i > idx && !m);
    if (nextEmpty !== -1) focusLater(moveRefs.current[nextEmpty]?.querySelector("button"));
    else if (idx < 3) focusLater(moveRefs.current[idx + 1]?.querySelector("button"));
    else focusLater(levelRef.current);
  };

  const clearMove = (idx: number) => {
    const moves = [...set.moves];
    moves[idx] = "";
    update({ moves });
  };

  /* ── Empty slot ────────────────────────────────────────────────────────── */
  if (!sp) {
    return (
      <>
        <DkEmpty icon="search" title={t("editor.emptyTitle")} lead={t("editor.emptyLead")} className="min-h-[17.5rem] content-center">
          <Button variant="pri" icon="plus" onClick={() => setPicker({ kind: "species" })}>
            {t("picker.species")}
          </Button>
        </DkEmpty>
        <Picker
          open={picker?.kind === "species"}
          kind="species"
          value={set.species}
          legalSpecies={roster}
          loading={legalSpecies.loading}
          onPick={pickSpecies}
          onClose={() => setPicker(null)}
        />
      </>
    );
  }

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const abilityOptions = (() => {
    const entries = Object.entries(sp.abilities).filter(([, name]) => Boolean(name)) as [string, string][];
    const opts = entries.map(([slot, name]) => ({ value: name, label: name, sub: slot === "H" ? t("set.hidden") : undefined }));
    if (set.ability && !opts.some((o) => toId(o.value) === toId(set.ability))) {
      const a = Dex.abilities.get(set.ability);
      opts.push({ value: set.ability, label: a.exists ? a.name : set.ability, sub: undefined });
    }
    return opts;
  })();
  const currentAbility = abilityOptions.find((o) => toId(o.value) === toId(set.ability))?.value ?? "";
  const itemData = set.item ? Dex.items.get(set.item) : null;
  const itemStyle = itemIconStyle(itemData?.exists ? itemData.name : undefined);
  const gender = canonicalGender(set.gender);
  const tera = canonicalType(set.teraType);
  const base = sp.baseStats as Record<StatId, number>;
  const chosenMoves = set.moves.map((m) => toId(m)).filter(Boolean);
  const speciesIllegal = Boolean(roster && !roster.has(sp.id));

  const moveInfo = (name: string): TbMoveInfo | null => {
    if (!name) return null;
    const m = Dex.moves.get(name);
    if (!m.exists) return { name, type: "Normal", cat: "status", power: 0, accuracy: true, pp: 0 };
    return { name: m.name, type: m.type, cat: CAT_KEY[m.category] ?? "status", power: m.basePower, accuracy: m.accuracy, pp: m.pp };
  };
  const figuresOf = (m: TbMoveInfo) => ({
    power: `${t("set.power")} ${m.power || "—"}`,
    accuracy: `${t("set.accuracy")} ${m.accuracy === true ? "—" : `${m.accuracy}%`}`,
    pp: `${m.pp} ${t("set.pp")}`,
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 min-[1024px]:grid-cols-2">
        {/* ── Species card ─────────────────────────────────────────────── */}
        <BsimSection
          kicker={t("editor.kicker", { n: slotIndex + 1 })}
          title={sp.name}
          aside={
            <span className="flex items-center gap-1">
              {/* Same reason the move rows keep their tag: the picker's red
                  mark disappears the instant you choose, and the validator's
                  objection lives in another pane. */}
              {speciesIllegal && (
                <b className="cut cut-edge-slant [--cut:3px] mr-1 flex-none border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-[0.3125rem] py-[3px] font-mono text-[0.53125rem]/none font-bold uppercase tracking-[0.08em] text-bad">
                  {t("picker.illegal")}
                </b>
              )}
              {actions}
              <Button size="sm" variant="ghost" icon="swap" onClick={() => setPicker({ kind: "species" })}>
                {t("set.changeSpecies")}
              </Button>
            </span>
          }
          bodyClassName="grid gap-4 p-4"
        >
          {/* `items-center` on the stacked layout made the stats column
              shrink-to-fit, so under 480px the base-stat bars sat in a 200px
              island against the left edge of a full-width card. The sprite
              centres itself instead. */}
          <div className="flex gap-4 max-[480px]:flex-col">
            <button
              type="button"
              onClick={() => setPicker({ kind: "species" })}
              aria-label={t("set.changeSpecies")}
              className={cn(
                "cut-seal cut-seal-edge [--cut:12px] [--cut-line:var(--line)] grid h-[7rem] w-[7rem] flex-none place-items-center border border-solid border-line bg-base-2 transition-[border-color] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)] max-[480px]:self-center",
                BSIM_FOCUS_CUT,
                speciesPop,
              )}
            >
              <img src={speciesSprite(sp.name)} alt="" width={96} height={96} onError={handleSpriteError} className="h-24 w-24 object-contain" />
            </button>
            <div className="grid min-w-0 flex-1 content-start gap-3">
              <BxTypeRow types={[...sp.types]} ghost={false} />
              <div className="grid gap-[0.3125rem]">
                <TbKicker>{t("set.baseStats")}</TbKicker>
                {STAT_IDS.map((stat) => (
                  <div key={stat} className="grid grid-cols-[2.125rem_minmax(0,1fr)_2.125rem] items-center gap-2">
                    <span className="font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.06em] text-txt-muted">{labels.statShort(stat)}</span>
                    <TbStatBar value={base[stat]} />
                    <span className="text-right font-mono text-[0.6875rem]/none font-semibold tabular-nums text-txt">{base[stat]}</span>
                  </div>
                ))}
                <div className="grid grid-cols-[2.125rem_minmax(0,1fr)_2.125rem] items-center gap-2 pt-px">
                  <span className="font-mono text-[0.5625rem]/none font-semibold uppercase tracking-[0.06em] text-txt-dim">{t("set.total")}</span>
                  <span />
                  <span className="text-right font-mono text-[0.6875rem]/none font-bold tabular-nums text-accent-bright">{sp.bst}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ability */}
          <div ref={abilityRef} className="grid gap-[0.4375rem]">
            <TbKicker>{t("set.ability")}</TbKicker>
            <div className="flex flex-wrap items-center gap-[0.375rem]">
              <TbSegChoice options={abilityOptions} value={currentAbility} onChange={(v) => update({ ability: v })} ariaLabel={t("set.ability")} />
              <Button size="sm" variant="ghost" onClick={() => setPicker({ kind: "ability" })}>
                {t("set.otherAbility")}
              </Button>
            </div>
          </div>

          {/* item */}
          <div className="grid gap-[0.4375rem]">
            <TbKicker>{t("set.item")}</TbKicker>
            <div className="flex items-center gap-[0.375rem]">
              <button ref={itemRef} type="button" onClick={() => setPicker({ kind: "item" })} className={PICKER_TRIGGER} aria-label={`${t("set.item")}: ${itemData?.exists ? itemData.name : t("set.noItem")}`}>
                <span aria-hidden className="grid h-6 w-6 flex-none place-items-center">
                  {itemStyle ? <span style={itemStyle} className="block" /> : <Icon name="cube" size={15} className="text-txt-dim" />}
                </span>
                <span className={cn("min-w-0 flex-1 truncate font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.03em]", itemData?.exists ? "text-txt" : "text-txt-dim")}>
                  {itemData?.exists ? itemData.name : set.item || t("set.noItem")}
                </span>
                <Icon name="chevronDown" size={14} className="flex-none text-txt-dim" />
              </button>
              {set.item && <TbIconAction size="md" name="x" label={t("set.clearItem")} onClick={() => update({ item: "" })} />}
            </div>
          </div>
        </BsimSection>

        {/* ── Moves ────────────────────────────────────────────────────── */}
        <BsimSection icon="zap" title={t("set.moves")} bodyClassName="grid content-start gap-2 p-4">
          {set.moves.map((name, i) => {
            const info = moveInfo(name);
            return (
              <div
                key={i}
                ref={(el) => {
                  moveRefs.current[i] = el;
                }}
              >
                <TbMoveRow
                  index={i}
                  move={info}
                  label={t("set.moveN", { n: i + 1 })}
                  onClick={() => setPicker({ kind: "move", moveIdx: i })}
                  onClear={info ? () => clearMove(i) : undefined}
                  clearLabel={t("set.clearMove", { n: i + 1 })}
                  figures={info ? figuresOf(info) : undefined}
                  popKey={name}
                  // A move stays marked after the picker closes: the picker's
                  // red tag would otherwise be the only warning, and it is gone
                  // the moment you choose. `legal` is null when the lookup could
                  // not answer, and then nothing is marked.
                  illegal={Boolean(info && legal && !legal.has(toId(info.name)))}
                  illegalLabel={t("picker.illegal")}
                />
              </div>
            );
          })}
        </BsimSection>
      </div>

      {/* ── Level / gender / shiny / Tera ───────────────────────────────── */}
      <BsimSection icon="sliders" title={t("set.details")} bodyClassName="grid gap-4 p-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          {limits.fixedLevel !== null ? (
            // Champions is played at 50, always. A disabled input would still
            // read as a control the builder is being denied; the number and the
            // one-line reason say it is not a choice anyone has.
            <div className="grid gap-[0.4375rem]">
              <TbKicker>{t("set.level")}</TbKicker>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 items-center font-mono text-[0.8125rem]/none font-bold tabular-nums text-txt">{limits.fixedLevel}</span>
                <span className="font-body text-[0.75rem] leading-[1.35] text-txt-dim">{t("set.levelLocked")}</span>
              </div>
            </div>
          ) : (
            <label className="grid gap-[0.4375rem]">
              <TbKicker>{t("set.level")}</TbKicker>
              <TbNumInput
                ref={levelRef}
                min={1}
                max={100}
                value={set.level}
                aria-label={t("set.level")}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update({ level: Math.max(1, Math.min(100, Number.isNaN(n) ? 100 : n)) });
                }}
              />
            </label>
          )}
          <div className="grid gap-[0.4375rem]">
            <TbKicker>{t("set.gender")}</TbKicker>
            {sp.gender ? (
              <span className="inline-flex h-8 items-center font-display text-[0.75rem]/none font-bold uppercase tracking-[0.04em] text-txt-muted">{labels.gender(sp.gender)}</span>
            ) : (
              <TbSegChoice
                ariaLabel={t("set.gender")}
                value={gender}
                onChange={(v) => update({ gender: v })}
                options={[
                  { value: "", label: t("set.genderAny") },
                  { value: "M", label: t("set.genderM") },
                  { value: "F", label: t("set.genderF") },
                ]}
              />
            )}
          </div>
          <div className="grid gap-[0.4375rem]">
            <TbKicker>{t("set.shiny")}</TbKicker>
            <Checkbox checked={Boolean(set.shiny)} onChange={(v) => update({ shiny: v })} label={t("set.shiny")} className="h-8" />
          </div>
        </div>
        <div className="grid gap-[0.4375rem]">
          <TbKicker>{t("set.tera")}</TbKicker>
          <div role="radiogroup" aria-label={t("set.tera")} className="flex flex-wrap gap-[0.3125rem]">
            {TYPE_LIST.map((ty) => (
              <TbTypeChip key={ty} type={ty} small label={labels.type(ty)} on={tera === ty} onClick={() => update({ teraType: ty })} />
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={!tera}
              onClick={() => update({ teraType: "" })}
              className={cn(
                "cut cut-edge-slant [--cut:3px] inline-flex h-8 items-center border border-solid px-[0.625rem] font-mono text-[0.5625rem]/none font-semibold uppercase tracking-[0.08em] transition-[background,color,border-color] duration-[140ms]",
                !tera ? "border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt" : "border-line [--cut-line:var(--line)] bg-base text-txt-dim hover:text-txt",
                BSIM_FOCUS_CUT,
              )}
            >
              {t("set.teraNone")}
            </button>
          </div>
        </div>
      </BsimSection>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <BsimSection icon="chart" title={`${limits.system === "sp" ? t("set.sp") : t("set.evs")} · ${t("set.nature")}`} bodyClassName="p-4">
        <StatEditor set={{ ...set, nature: canonicalNature(set.nature) }} base={base} format={format} labels={labels} onChange={update} />
      </BsimSection>

      <Picker
        open={picker !== null}
        kind={picker?.kind ?? "species"}
        value={
          picker?.kind === "species"
            ? sp.id
            : picker?.kind === "ability"
              ? toId(set.ability)
              : picker?.kind === "item"
                ? toId(set.item)
                : picker?.kind === "move"
                  ? toId(set.moves[picker.moveIdx ?? 0])
                  : undefined
        }
        legalMoves={picker?.kind === "move" ? legal : undefined}
        legalSpecies={picker?.kind === "species" ? roster : undefined}
        loading={
          (picker?.kind === "move" && legalMoves.loading) || (picker?.kind === "species" && legalSpecies.loading)
        }
        preferredIds={picker?.kind === "ability" ? abilityOptions.map((o) => toId(o.value)) : undefined}
        excludeIds={picker?.kind === "move" ? chosenMoves.filter((_, i) => i !== picker.moveIdx) : undefined}
        onPick={(id) => {
          if (!picker) return;
          if (picker.kind === "species") pickSpecies(id);
          else if (picker.kind === "ability") pickAbility(id);
          else if (picker.kind === "item") pickItem(id);
          else pickMove(picker.moveIdx ?? 0, id);
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
