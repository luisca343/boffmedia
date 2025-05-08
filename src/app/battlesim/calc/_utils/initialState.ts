import { GenderName, StatusName, TypeName } from "@smogon/calc/dist/data/interface";

export const DEFAULT_ATTACKER = {
      pokemonId: "wingull",
      moveIds: ["Aeroblast", "Hydro Cannon", "Eternabeam", "Prismatic Laser"],
      nature: "Modest",
      evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      level: 100,
      teraType: "Water" as TypeName,
      isTerastallized: false,
      gender: "Male" as GenderName,
      ability: "Intimidate",
      item: "Choice Specs",
      status: "Healthy" as StatusName,
      currentHp: 383,
      currentHpPercent: 100
 }