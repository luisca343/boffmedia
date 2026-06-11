import { effMult } from "./bs-data"

const MV = (name: string, type: string, cat: string, power: number, acc: number | null, pp: number, extra: Record<string, any> = {}) =>
  ({ name, type, cat, power, acc, pp, maxpp: pp, prio: 0, ...extra })

const MOVESETS: Record<string, any[]> = {
  garchomp: [
    MV("Terremoto", "Ground", "phys", 100, 100, 16, { spread: "all" }),
    MV("Garra Dragón", "Dragon", "phys", 80, 100, 24),
    MV("Roca Afilada", "Rock", "phys", 100, 80, 8),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  fluttermane: [
    MV("Fuerza Lunar", "Fairy", "spec", 95, 100, 24),
    MV("Bola Sombra", "Ghost", "spec", 80, 100, 24),
    MV("Brillo Mágico", "Fairy", "spec", 80, 100, 16, { spread: "foes" }),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  dragonite: [
    MV("Velocidad Extrema", "Normal", "phys", 80, 100, 8, { prio: 2 }),
    MV("Acróbata", "Flying", "phys", 110, 100, 24),
    MV("Enfado", "Dragon", "phys", 120, 100, 16),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  ironhands: [
    MV("Sorpresa", "Normal", "phys", 40, 100, 16, { prio: 3 }),
    MV("A Bocajarro", "Fighting", "phys", 120, 100, 8),
    MV("Voltio Cruel", "Electric", "phys", 90, 100, 24),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  rillaboom: [
    MV("Mazazo", "Grass", "phys", 120, 100, 24),
    MV("Desarme", "Dark", "phys", 65, 100, 32),
    MV("Sorpresa", "Normal", "phys", 40, 100, 16, { prio: 3 }),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  miraidon: [
    MV("Electroderrape", "Electric", "spec", 100, 100, 8),
    MV("Dracometeoro", "Dragon", "spec", 130, 90, 8),
    MV("Descarga", "Electric", "spec", 80, 100, 24, { spread: "foes" }),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  kingambit: [
    MV("Hachazo Pérfido", "Dark", "phys", 85, 100, 16),
    MV("Cabeza de Hierro", "Steel", "phys", 80, 100, 24),
    MV("Golpe Bajo", "Dark", "phys", 70, 100, 8, { prio: 1 }),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
  amoonguss: [
    MV("Espora", "Grass", "status", 0, 100, 24, { effect: "slp" }),
    MV("Polvo Ira", "Bug", "status", 0, null, 32, { effect: "redirect", prio: 2 }),
    MV("Bola de Polen", "Bug", "spec", 90, 100, 24),
    MV("Protección", "Normal", "status", 0, null, 16, { effect: "protect" }),
  ],
}

const MON_DATA: Record<string, any> = {
  garchomp: { id: "garchomp", name: "Garchomp", types: ["Dragon", "Ground"], teraType: "Steel", stats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 } },
  fluttermane: { id: "fluttermane", name: "Flutter Mane", types: ["Ghost", "Fairy"], teraType: "Fairy", stats: { hp: 55, atk: 55, def: 55, spa: 135, spd: 135, spe: 135 } },
  dragonite: { id: "dragonite", name: "Dragonite", types: ["Dragon", "Flying"], teraType: "Normal", stats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 } },
  ironhands: { id: "ironhands", name: "Iron Hands", types: ["Fighting", "Electric"], teraType: "Fire", stats: { hp: 154, atk: 140, def: 108, spa: 50, spd: 68, spe: 50 } },
  rillaboom: { id: "rillaboom", name: "Rillaboom", types: ["Grass"], teraType: "Fire", stats: { hp: 100, atk: 125, def: 90, spa: 60, spd: 70, spe: 85 } },
  miraidon: { id: "miraidon", name: "Miraidon", types: ["Electric", "Dragon"], teraType: "Fairy", stats: { hp: 100, atk: 85, def: 100, spa: 135, spd: 115, spe: 135 } },
  kingambit: { id: "kingambit", name: "Kingambit", types: ["Dark", "Steel"], teraType: "Fire", stats: { hp: 100, atk: 135, def: 120, spa: 60, spd: 85, spe: 50 } },
  amoonguss: { id: "amoonguss", name: "Amoonguss", types: ["Grass", "Poison"], teraType: "Water", stats: { hp: 114, atk: 85, def: 70, spa: 85, spd: 80, spe: 30 } },
}

interface BSXMon {
  id: string; name: string; types: string[]; hp: number; fnt?: boolean; tera?: boolean;
  teraType?: string; status?: string | null; boosts?: Record<string, number>;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves?: any[]; sleepT?: number; protect?: boolean;
}

function freshMon(key: string): BSXMon {
  const base = MON_DATA[key]
  if (!base) return {} as BSXMon
  return {
    ...base,
    hp: 100, status: null, sleepT: 0, boosts: {}, tera: false,
    fnt: false, protect: false,
    moves: MOVESETS[key]?.map((m: any) => ({ ...m })) || [],
  }
}

const boostMult = (b: number) => (b >= 0 ? (2 + b) / 2 : 2 / (2 - b))

const statOf = (mon: BSXMon, k: string) => Math.round(mon.stats[k as keyof typeof mon.stats] * boostMult((mon.boosts || {})[k] || 0))

const effSpeed = (mon: BSXMon) => Math.round(statOf(mon, "spe") * (mon.status === "par" ? 0.5 : 1))

function calcRange(att: BSXMon, move: any, def: BSXMon, opts: any = {}) {
  if (!att || !def || move.cat === "status") return null
  const defTypes = def.tera ? [def.teraType || ""] : def.types
  const eff = effMult(move.type, defTypes)
  const aKey = move.cat === "phys" ? "atk" : "spa"
  const dKey = move.cat === "phys" ? "def" : "spd"
  let stab = att.types.includes(move.type) ? 1.5 : 1
  if ((opts.tera || att.tera) && att.teraType === move.type) stab = att.types.includes(move.type) ? 2 : 1.5
  let base = move.power * (statOf(att, aKey) / statOf(def, dKey)) * 0.3 * stab * eff
  if (opts.spread) base *= 0.75
  if (att.status === "brn" && move.cat === "phys") base *= 0.5
  base *= 120 / (def.stats.hp + 60)
  return { min: Math.max(eff === 0 ? 0 : 1, Math.round(base * 0.85)), max: Math.max(eff === 0 ? 0 : 1, Math.round(base)), eff }
}

function koLabel(range: any, hp: number) {
  if (!range || range.max <= 0) return null
  if (range.min >= hp) return { t: "KO garantizado", cls: "sure" as const }
  if (range.max >= hp) {
    const p = Math.round(((range.max - hp) / Math.max(1, range.max - range.min)) * 100)
    return { t: `Posible KO · ~${Math.min(95, Math.max(5, p))}%`, cls: "maybe" as const }
  }
  return null
}

function speedOrder(slots: { mon?: BSXMon; side: string; idx: number }[]) {
  return slots.filter((s) => s.mon && !s.mon.fnt)
    .map((s) => ({ ...s, spe: effSpeed(s.mon!) }))
    .sort((a: any, b: any) => b.spe - a.spe)
}

export {
  MOVESETS,
  MON_DATA,
  freshMon,
  boostMult,
  statOf,
  effSpeed,
  calcRange,
  koLabel,
  speedOrder,
}

export type { BSXMon }
