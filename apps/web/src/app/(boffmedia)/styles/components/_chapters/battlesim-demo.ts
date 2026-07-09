// Demo battle core for the Battlesim showcase: a tiny DEX of real-ish mons plus
// a `bxMon` factory that mirrors the handoff's `BSIM.freshMon`. Feeds the live
// Bx* specimens (plate, key, bench, score, order, slot). English type keys to
// match bx-helpers' TYPE_HEX/TYPE_ES. [deferred] — real battles use the engine.
import type { BxMon, BxMove } from "@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_lib/bx-helpers"

type DexEntry = {
  id: string
  name: string
  types: string[]
  item?: string
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
  moves: BxMove[]
}

const mv = (name: string, type: string, cat: string, power: number, extra: Partial<BxMove> = {}): BxMove => ({
  name, type, cat, power, acc: 100, pp: 16, maxpp: 16, ...extra,
})

export const DEX: Record<string, DexEntry> = {
  garchomp: {
    id: "garchomp", name: "Garchomp", types: ["Dragon", "Ground"], item: "Vidasfera",
    stats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
    moves: [
      mv("Terremoto", "Ground", "phys", 100, { spread: "all", pp: 10, maxpp: 10 }),
      mv("Garra Dragón", "Dragon", "phys", 80),
      mv("Colmillo Ígneo", "Fire", "phys", 65, { pp: 15, maxpp: 15 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  fluttermane: {
    id: "fluttermane", name: "Flutter Mane", types: ["Ghost", "Fairy"], item: "Gafas Especiales",
    stats: { hp: 55, atk: 55, def: 55, spa: 135, spd: 135, spe: 135 },
    moves: [
      mv("Bola Sombra", "Ghost", "spec", 80, { pp: 15, maxpp: 15 }),
      mv("Fuerza Lunar", "Fairy", "spec", 95, { pp: 15, maxpp: 15 }),
      mv("Ida y Vuelta", "Bug", "phys", 70, { pp: 20, maxpp: 20 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  ironhands: {
    id: "ironhands", name: "Iron Hands", types: ["Fighting", "Electric"], item: "Semilla Eléctrica",
    stats: { hp: 154, atk: 140, def: 108, spa: 50, spd: 68, spe: 50 },
    moves: [
      mv("Puño Trueno", "Electric", "phys", 75, { pp: 15, maxpp: 15 }),
      mv("A Bocajarro", "Fighting", "phys", 120, { pp: 5, maxpp: 5 }),
      mv("Puño Hielo", "Ice", "phys", 75, { pp: 15, maxpp: 15 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  torkoal: {
    id: "torkoal", name: "Torkoal", types: ["Fire"], item: "Roca Calor",
    stats: { hp: 70, atk: 85, def: 140, spa: 85, spd: 70, spe: 20 },
    moves: [
      mv("Lanzallamas", "Fire", "spec", 90, { pp: 15, maxpp: 15 }),
      mv("Tierra Viva", "Ground", "spec", 90, { pp: 10, maxpp: 10 }),
      mv("Eructo", "Poison", "spec", 120, { pp: 10, maxpp: 10 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  dragonite: {
    id: "dragonite", name: "Dragonite", types: ["Dragon", "Flying"], item: "Fruta Lum",
    stats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 },
    moves: [
      mv("Enfado", "Dragon", "phys", 120, { pp: 10, maxpp: 10 }),
      mv("Vuelo", "Flying", "phys", 90, { pp: 15, maxpp: 15 }),
      mv("Puño Trueno", "Electric", "phys", 75, { pp: 15, maxpp: 15 }),
      mv("Danza Dragón", "Dragon", "status", 0, { pp: 20, maxpp: 20 }),
    ],
  },
  miraidon: {
    id: "miraidon", name: "Miraidon", types: ["Electric", "Dragon"], item: "Semilla Electro",
    stats: { hp: 100, atk: 85, def: 100, spa: 135, spd: 115, spe: 135 },
    moves: [
      mv("Foto Ígneo", "Electric", "spec", 100, { pp: 5, maxpp: 5 }),
      mv("Pulso Dragón", "Dragon", "spec", 85, { pp: 10, maxpp: 10 }),
      mv("Vozarrón", "Normal", "spec", 90, { spread: "all", pp: 10, maxpp: 10 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  kingambit: {
    id: "kingambit", name: "Kingambit", types: ["Dark", "Steel"], item: "Cinta Focus",
    stats: { hp: 100, atk: 135, def: 120, spa: 60, spd: 85, spe: 50 },
    moves: [
      mv("Golpe Bajo", "Dark", "phys", 70, { prio: 1, pp: 5, maxpp: 5 }),
      mv("Fauces Kowtow", "Dark", "phys", 85, { pp: 10, maxpp: 10 }),
      mv("Cabeza de Hierro", "Steel", "phys", 80, { pp: 15, maxpp: 15 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  amoonguss: {
    id: "amoonguss", name: "Amoonguss", types: ["Grass", "Poison"], item: "Cuerno Ocaso",
    stats: { hp: 114, atk: 85, def: 70, spa: 85, spd: 80, spe: 30 },
    moves: [
      mv("Espora", "Grass", "status", 0, { pp: 15, maxpp: 15 }),
      mv("Bomba Germen", "Grass", "phys", 80, { pp: 15, maxpp: 15 }),
      mv("Rayo Solar", "Grass", "spec", 120, { pp: 10, maxpp: 10 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  rillaboom: {
    id: "rillaboom", name: "Rillaboom", types: ["Grass"], item: "Semilla Grado",
    stats: { hp: 100, atk: 125, def: 90, spa: 60, spd: 70, spe: 85 },
    moves: [
      mv("Tamborrileo", "Grass", "phys", 130, { pp: 10, maxpp: 10 }),
      mv("Puño Sombra", "Ghost", "phys", 60, { prio: 1, pp: 20, maxpp: 20 }),
      mv("Ida y Vuelta", "Bug", "phys", 70, { pp: 20, maxpp: 20 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
  gholdengo: {
    id: "gholdengo", name: "Gholdengo", types: ["Steel", "Ghost"], item: "Restos",
    stats: { hp: 87, atk: 60, def: 95, spa: 133, spd: 91, spe: 84 },
    moves: [
      mv("Bola Sombra", "Ghost", "spec", 80, { pp: 15, maxpp: 15 }),
      mv("Fugoequipaje", "Steel", "spec", 120, { pp: 5, maxpp: 5 }),
      mv("Onda Trueno", "Electric", "status", 0, { pp: 20, maxpp: 20 }),
      mv("Protección", "Normal", "status", 0, { prio: 4, pp: 10, maxpp: 10 }),
    ],
  },
}

export type BxMonExtra = Partial<BxMon>
export function bxMon(key: string, extra: BxMonExtra = {}): BxMon {
  const d = DEX[key]
  return {
    id: d.id, name: d.name, types: [...d.types], stats: { ...d.stats }, moves: [...d.moves],
    hp: 100, status: null, boosts: {},
    ...extra,
  }
}

export const STAT_ES: Record<string, string> = { hp: "PS", atk: "Atq", def: "Def", spa: "AtE", spd: "DfE", spe: "Vel" }

// Neutral-nature stat at level 50 with perfect IVs — for the EV-control specimen.
export function finalStat(base: number, key: string, evs: Record<string, number>): number {
  const ev = evs[key] || 0
  const core = Math.floor(((2 * base + 31 + Math.floor(ev / 4)) * 50) / 100)
  return key === "hp" ? core + 50 + 10 : core + 5
}
