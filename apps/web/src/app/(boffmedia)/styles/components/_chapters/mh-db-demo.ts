// Mock data for the Armería (mh-db) chapter — the real MHDB armor/weapon layer
// isn't wired to the design system, so specimens are fed from here with resolved
// shapes so the components stay prop-driven. [deferred]
import type { MhArmorPiece, MhArmorSet, MhSkill, MhWeapon } from "@/components/boffmedia/ui/mh-db"

const SKILLS: Record<number, MhSkill> = {
  1: { id: 1, name: "Ataque", category: "attack", description: "Aumenta el ataque base." },
  2: { id: 2, name: "Ojo crítico", category: "attack", description: "Aumenta la afinidad." },
  3: { id: 3, name: "Artesano", category: "utility", description: "Mejora el nivel de afilado." },
  4: { id: 4, name: "Refuerzo elemental", category: "element", description: "Potencia el daño elemental." },
  5: { id: 5, name: "Constitución", category: "defense", description: "Reduce el consumo de resistencia." },
  6: { id: 6, name: "Recuperación", category: "utility", description: "Acelera la curación." },
}

const s = (id: number, level: number) => ({ skill: SKILLS[id], level })

const PIECES: Record<number, MhArmorPiece> = {
  101: { id: 101, kind: "head", kindLabel: "Casco", name: "Casco de Rathalos α", skills: [s(1, 1)], slots: [1, 0, 0], defense: 62 },
  102: { id: 102, kind: "chest", kindLabel: "Malla", name: "Malla de Rathalos α", skills: [s(4, 2), s(2, 1)], slots: [2, 1, 0], defense: 64 },
  103: { id: 103, kind: "arms", kindLabel: "Guanteletes", name: "Guanteletes de Rathalos α", skills: [s(1, 1)], slots: [1, 0, 0], defense: 60 },
  104: { id: 104, kind: "waist", kindLabel: "Faja", name: "Faja de Rathalos α", skills: [s(2, 1)], slots: [1, 0, 0], defense: 58 },
  105: { id: 105, kind: "legs", kindLabel: "Grebas", name: "Grebas de Rathalos α", skills: [s(4, 1)], slots: [0, 0, 0], defense: 60 },
}

const SETS: Record<number, MhArmorSet> = {
  1: {
    id: 1, name: "Rathalos α", series: "Rathalos", rarity: 7, hue: 8,
    bonus: {
      name: "Furia de Rathalos",
      ranks: [
        { pieces: 2, skillName: "Refuerzo elemental (Fuego)", level: 1, desc: "Potencia el daño de fuego de tu arma." },
        { pieces: 4, skillName: "Ataque crítico elemental", level: 1, desc: "Los golpes críticos aumentan el daño elemental." },
      ],
    },
    profile: {
      pieces: 5,
      defense: { base: 304, max: 360 },
      resistances: { fire: 20, water: -10, thunder: 5, ice: -5, dragon: -15 },
      skills: [s(4, 3), s(1, 3), s(2, 1), s(3, 1), s(5, 2)],
    },
  },
  2: {
    id: 2, name: "Anjanath β", series: "Anjanath", rarity: 6, hue: 25,
    bonus: { name: "Ira de Anjanath", ranks: [{ pieces: 3, skillName: "Ataque", level: 1, desc: "Aumenta el ataque cuando estás en peligro." }] },
    profile: { pieces: 5, defense: { base: 288, max: 340 }, resistances: { fire: 8, ice: -8 }, skills: [s(1, 2), s(6, 1)] },
  },
  3: {
    id: 3, name: "Diablos α", series: "Diablos", rarity: 7, hue: 45,
    bonus: { name: "Tiranía de Diablos", ranks: [{ pieces: 2, skillName: "Maestría de bloqueo", level: 1, desc: "Mejora el bloqueo perfecto." }] },
    group: { name: "Grupo Guardián", ranks: [{ pieces: 2, skillName: "Recolección de setas", level: 1, desc: "Permite consumir setas normalmente venenosas." }] },
    profile: { pieces: 5, defense: { base: 320, max: 380 }, resistances: { fire: 6, ice: 4, dragon: -12 }, skills: [s(5, 2), s(3, 1)] },
  },
}

function sharp(base: number[], max: number[]): Pick<MhWeapon, "sharpness" | "sharpnessMax" | "handicraftLevels"> {
  return { sharpness: base, sharpnessMax: max, handicraftLevels: 5 }
}

// sharpness order: red, orange, yellow, green, blue, white, purple
const WEAPONS: Record<number, MhWeapon> = {
  1006: {
    id: 1006, type: "long-sword", typeLabel: "Espada larga", typeIcon: "sword", name: "Sable de Rathalos", rarity: 7,
    attack: 462, affinity: 0, special: { color: "#ff7a5c", value: 240, short: "FUE" },
    ...sharp([0, 0, 40, 70, 50, 20, 0], [0, 0, 20, 50, 60, 40, 10]),
  },
  5006: {
    id: 5006, type: "great-sword", typeLabel: "Gran espada", typeIcon: "sword", name: "Gran espada del terror", rarity: 6,
    attack: 528, affinity: -10, ...sharp([0, 20, 60, 70, 30, 0, 0], [0, 0, 40, 70, 50, 20, 0]),
  },
  6003: {
    id: 6003, type: "charge-blade", typeLabel: "Espada carga", typeIcon: "shield", name: "Descarga Diablos", rarity: 7,
    attack: 486, affinity: 5, elderseal: "average", ...sharp([0, 0, 30, 60, 60, 30, 0], [0, 0, 10, 40, 70, 40, 20]),
    extra: { phial: "impact" },
  },
  4005: {
    id: 4005, type: "bow", typeLabel: "Arco", typeIcon: "target", name: "Arco del cazador", rarity: 6,
    attack: 300, affinity: 15, special: { color: "#a855f7", value: 180, short: "VEN" },
    extra: { coatings: ["close-range", "power", "pierce", "paralysis"] },
  },
  7003: {
    id: 7003, type: "hunting-horn", typeLabel: "Cuerno de caza", typeIcon: "bolt", name: "Cuerno resonante", rarity: 6,
    attack: 470, affinity: 0, ...sharp([0, 0, 50, 60, 40, 10, 0], [0, 0, 30, 50, 50, 30, 0]),
    extra: {
      melody: ["purple", "red", "white"],
      songs: [
        { name: "Ataque y afinidad +", sequence: ["white", "red", "white"] },
        { name: "Salud recuperada +", sequence: ["purple", "purple", "white"] },
        { name: "Resistencia a aturdimiento", sequence: ["red", "white", "red"] },
      ],
    },
  },
}

export const MHDB = {
  armorSet: (id: number) => SETS[id],
  armorSetProfile: (id: number) => SETS[id].profile,
  armor: (id: number) => PIECES[id],
  weapon: (id: number) => WEAPONS[id],
  skill: (id: number) => SKILLS[id],
  allSets: Object.values(SETS),
}

export const MH_MAX_DEF = Math.max(...MHDB.allSets.map((x) => x.profile.defense.max))
