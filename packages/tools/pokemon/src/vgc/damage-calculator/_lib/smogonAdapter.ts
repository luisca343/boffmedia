import { calculate, Move, Pokemon, Field, Generations } from '@smogon/calc'
import type { State } from '@smogon/calc'
import type {
  CalcPokemon,
  CalcField,
  CalcMove,
  DamageResult,
  SideConditions,
} from '../_types/calculator'

const GEN9 = Generations.get(9)

// Champions format uses SP (max 32, total 66) instead of EVs (max 252, total 510).
// Until @smogon/calc exposes a native Champions stat formula, we approximate by scaling:
// sp → ev equivalent = floor(sp * 252 / 32). Max SP 32 → EV 252 (exact).
// This is accurate at the extremes; intermediate values differ by at most 1 stat point.
function spToEv(sp: number): number {
  return Math.floor((sp * 252) / 32)
}

function toSmogonEvs(
  evs: CalcPokemon['evs'],
  useChampions: boolean,
): Partial<State.Pokemon['evs'] & object> {
  if (!useChampions) return evs
  return {
    hp: spToEv(evs.hp),
    atk: spToEv(evs.atk),
    def: spToEv(evs.def),
    spa: spToEv(evs.spa),
    spd: spToEv(evs.spd),
    spe: spToEv(evs.spe),
  }
}

function toSmogonPokemon(
  p: CalcPokemon,
  role: 'atk' | 'def',
  useChampions: boolean,
): Pokemon {
  const evs = toSmogonEvs(p.evs, useChampions)
  const boosts: Partial<State.Pokemon['boosts'] & object> = {
    atk: p.boosts.atk,
    def: p.boosts.def,
    spa: p.boosts.spa,
    spd: p.boosts.spd,
    spe: p.boosts.spe,
  }

  const opts: Partial<State.Pokemon> = {
    level: p.level,
    nature: p.nature as State.Pokemon['nature'],
    ability: p.ability as State.Pokemon['ability'],
    item: p.item !== 'None' ? (p.item as State.Pokemon['item']) : undefined,
    status: p.status !== 'Healthy' ? (p.status as State.Pokemon['status']) : undefined,
    teraType: p.teraType !== 'None' ? (p.teraType as State.Pokemon['teraType']) : undefined,
    evs: evs as State.Pokemon['evs'],
    ivs: p.ivs as State.Pokemon['ivs'],
    boosts: boosts as State.Pokemon['boosts'],
    originalCurHP: p.currentHP >= 0 ? p.currentHP : undefined,
  }

  return new Pokemon(GEN9, p.name as State.Pokemon['name'], opts)
}

function toSmogonSide(side: SideConditions): State.Side {
  return {
    isSR: side.stealthRock,
    spikes: side.spikes,
    isReflect: side.reflect,
    isLightScreen: side.lightScreen,
    isAuroraVeil: side.auroraVeil,
    isTailwind: side.tailwind,
    isHelpingHand: side.helpingHand,
  }
}

function toSmogonField(field: CalcField): Field {
  const weather = field.weather === 'None' ? undefined : (field.weather as State.Field['weather'])
  const terrain =
    field.terrain === 'None' ? undefined : (field.terrain as State.Field['terrain'])

  const fieldParams: State.Field = {
    gameType: field.format === 'Doubles' ? 'Doubles' : 'Singles',
    weather,
    terrain,
    isMagicRoom: field.magicRoom,
    isWonderRoom: field.wonderRoom,
    isGravity: field.gravity,
    attackerSide: toSmogonSide(field.attackerSide),
    defenderSide: toSmogonSide(field.defenderSide),
  }

  return new Field(fieldParams)
}

export function calcDamage(
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  field: CalcField,
  useChampions = false,
): DamageResult | null {
  if (!move.name || move.bp === 0 || move.category === 'Status') return null

  try {
    const smogonAtk = toSmogonPokemon(attacker, 'atk', useChampions)
    const smogonDef = toSmogonPokemon(defender, 'def', useChampions)
    const smogonField = toSmogonField(field)

    const moveOpts: Partial<State.Move> = {
      isCrit: move.crit,
      hits: 1,
      overrides: { basePower: move.bp, type: move.type as any, category: move.category },
    }

    const smogonMove = new Move(GEN9, move.name as State.Move['name'], moveOpts)

    const result = calculate(GEN9, smogonAtk, smogonDef, smogonMove, smogonField)
    const damage = result.damage

    // damage can be number, number[], or [number[], number[]] for spread moves
    const rolls: number[] = Array.isArray(damage)
      ? Array.isArray(damage[0])
        ? (damage as [number[], number[]])[0]
        : (damage as number[])
      : [damage as number]

    if (!rolls.length) return null

    const defHP = smogonDef.originalCurHP
    const min = Math.min(...rolls)
    const max = Math.max(...rolls)

    return {
      rolls,
      min,
      max,
      minPct: (min / defHP) * 100,
      maxPct: (max / defHP) * 100,
      defHP,
      isPhysical: smogonMove.category === 'Physical',
      desc: result.desc(),
    }
  } catch {
    return null
  }
}

export function calcAllMoves(
  attacker: CalcPokemon,
  defender: CalcPokemon,
  field: CalcField,
  useChampions = false,
): (DamageResult | null)[] {
  return attacker.moves.map((move) => calcDamage(attacker, defender, move, field, useChampions))
}

export function getKOVerdict(res: DamageResult): { labelKey: string; colorClass: string } {
  const { minPct, maxPct } = res
  if (minPct >= 100) return { labelKey: 'guaranteedOHKO', colorClass: 'text-red-400' }
  if (minPct * 2 >= 100) return { labelKey: 'guaranteed2HKO', colorClass: 'text-accent-bright' }
  if (maxPct * 2 >= 100) return { labelKey: 'possible2HKO', colorClass: 'text-warning-hover' }
  if (maxPct >= 100) return { labelKey: 'possibleOHKO', colorClass: 'text-red-400' }
  return { labelKey: 'noKO', colorClass: 'text-txt-muted' }
}

export function getDamageColorClass(res: DamageResult): string {
  if (res.maxPct >= 100) return 'text-red-400'
  if (res.maxPct >= 75) return 'text-accent-bright'
  if (res.maxPct >= 50) return 'text-warning-hover'
  return 'text-txt-muted'
}
