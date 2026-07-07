"use client"

import { useTranslations } from "next-intl"
import { calcStat, Generations } from "@smogon/calc"
import { RoleTag } from "./ui/RoleTag"
import { PokemonSprite } from "./ui/PokemonSprite"
import { Combobox } from "./ui/Combobox"
import { TypeBadge } from "./ui/TypeBadge"
import { Field, Select } from "./ui/controls"
import { NumberStepper } from "./ui/NumberStepper"
import { HpGauge } from "./ui/HpGauge"
import { StatEditor } from "./ui/StatEditor"
import { ATK_COLOR, DEF_COLOR, cssVars } from "./ui/theme"
import type { CalcPokemon } from "../_types/calculator"
import { NATURES, useGameData } from "../_hooks/usePokemonData"
import { useLegalPokemon, type VgcPokemon } from "../_hooks/useLegalPokemon"
import { useCalculatorStore } from "../_store/calculatorStore"
import { MoveRow } from "./MoveRow"

const GEN9 = Generations.get(9)

const TERA_KEYS = [
  "None", "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting",
  "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon",
  "Dark", "Steel", "Fairy", "Stellar",
]
const STATUS_KEYS = ["Healthy", "Burned", "Paralyzed", "Poisoned", "Badly Poisoned", "Frozen", "Asleep"]

interface Props {
  poke: CalcPokemon
  side: "atk" | "def"
  onChange: (patch: Partial<CalcPokemon>) => void
  useChampions?: boolean
}

// attacker / defender editor, wired to real legal-Pokémon data.
export function PokemonPanel({ poke, side, onChange, useChampions = false }: Props) {
  const t = useTranslations("vgc.calc.panel")
  const tv = useTranslations("vgc.calc.ui")
  const { regulation } = useCalculatorStore()
  const legal = useLegalPokemon(regulation)
  const { items, abilities, moveMap, moveNames } = useGameData(regulation)
  const color = side === "atk" ? ATK_COLOR : DEF_COLOR

  const entry = legal.find((p) => p.name === poke.name)
  const baseStats = entry?.baseStats
  const speciesAbilities = entry ? (Object.values(entry.abilities).filter(Boolean) as string[]) : []

  const maxHP = baseStats
    ? calcStat(GEN9, "hp", baseStats.hp, poke.ivs.hp, useChampions ? Math.floor((poke.evs.hp * 252) / 32) : poke.evs.hp, poke.level, poke.nature)
    : 0
  const cur = poke.currentHP < 0 ? maxHP : Math.min(poke.currentHP, maxHP)

  const getSpecies = (q: string) => legal.filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 14)
  const setMove = (i: number, m: CalcPokemon["moves"][number]) =>
    onChange({ moves: poke.moves.map((mv, j) => (j === i ? m : mv)) as CalcPokemon["moves"] })

  return (
    <div
      className="cut-corner grid gap-[14px] border border-t-[3px] border-solid border-line bg-panel p-4"
      style={cssVars({ "--cxc": color, borderTopColor: "var(--cxc)" })}
    >
      <div>
        <RoleTag color={color}>{side === "atk" ? tv("attacker") : tv("defender")}</RoleTag>
      </div>

      <div className="flex items-start gap-3">
        <span className="grid h-16 w-16 flex-none place-items-center border border-solid border-line-2 bg-base">
          <PokemonSprite name={poke.name} size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <Combobox<VgcPokemon>
            value={poke.name}
            placeholder={t("searchPlaceholder")}
            ariaLabel={t("searchPlaceholder")}
            alignRight={side === "def"}
            getItems={getSpecies}
            itemKey={(it) => it.name}
            onPick={(it) => onChange({ name: it.name, ability: (Object.values(it.abilities).filter(Boolean)[0] as string) ?? poke.ability })}
            renderItem={(it) => (
              <>
                <PokemonSprite name={it.name} size={26} />
                <span>{it.name}</span>
                <span className="tail">
                  {it.types.map((tp) => (
                    <TypeBadge key={tp} type={tp} small />
                  ))}
                </span>
              </>
            )}
          />
          {entry && (
            <div className="mt-[7px] flex flex-wrap gap-1">
              {entry.types.map((tp) => (
                <TypeBadge key={tp} type={tp} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-[560px]:grid-cols-2">
        <Field label={t("ability")}>
          <Select
            value={poke.ability}
            options={speciesAbilities.length ? speciesAbilities : abilities.slice(0, 50)}
            onChange={(v) => onChange({ ability: v })}
            ariaLabel={t("ability")}
          />
        </Field>
        <Field label={t("item")}>
          <Select value={poke.item} options={items} onChange={(v) => onChange({ item: v })} ariaLabel={t("item")} />
        </Field>
        <Field label={t("status")}>
          <Select
            value={poke.status}
            options={STATUS_KEYS.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
            onChange={(v) => onChange({ status: v })}
            ariaLabel={t("status")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2 max-[560px]:grid-cols-2">
        <Field label={t("tera")}>
          <Select
            value={poke.teraType}
            options={TERA_KEYS.map((k) => ({ value: k, label: k === "None" ? t("teraNone") : t(`teraTypes.${k}`) }))}
            onChange={(v) => onChange({ teraType: v })}
            ariaLabel={t("tera")}
          />
        </Field>
        <Field label={t("nature")}>
          <Select
            value={poke.nature}
            options={NATURES.map((n) => ({
              value: n.name,
              label: n.plus ? `${n.name} (+${n.plus.toUpperCase()}, -${n.minus?.toUpperCase()})` : n.name,
            }))}
            onChange={(v) => onChange({ nature: v })}
            ariaLabel={t("nature")}
          />
        </Field>
        <Field label={t("lv")}>
          <NumberStepper value={poke.level} min={1} max={100} ariaLabel={t("lv")} onChange={(v) => onChange({ level: v })} />
        </Field>
      </div>

      <div className="grid gap-1.5">
        <div className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cxc, var(--accent))" }}>
          {t("moves")}
        </div>
        {poke.moves.map((m, i) => (
          <MoveRow key={i} move={m} idx={i} side={side} moveMap={moveMap} moveNames={moveNames} onChange={(nm) => setMove(i, nm)} />
        ))}
      </div>

      <HpGauge
        current={cur}
        max={maxHP || 1}
        label={t("hpLabel")}
        resetLabel={t("hpReset")}
        onChange={(v) => onChange({ currentHP: v })}
        onReset={() => onChange({ currentHP: -1 })}
      />

      {baseStats && <StatEditor poke={poke} baseStats={baseStats} onChange={onChange} useChampions={useChampions} />}
    </div>
  )
}
