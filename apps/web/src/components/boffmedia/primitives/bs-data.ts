const SPRITE = "https://play.pokemonshowdown.com/sprites"
export const aniF = (id: string) => `${SPRITE}/ani/${id}.gif`
export const aniB = (id: string) => `${SPRITE}/ani-back/${id}.gif`

export const TYPES = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison",
  "Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"]

export const tyVar = (t: string) => `var(--ty-${t.toLowerCase()})`

const CHART: Record<string, Record<string, number>> = {
  Normal:{Rock:.5,Ghost:0,Steel:.5},
  Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},
  Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},
  Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},
  Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},
  Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},
  Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},
  Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},
  Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},
  Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},
  Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},
  Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},
  Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},
  Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},
  Dragon:{Dragon:2,Steel:.5,Fairy:0},
  Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},
  Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
  Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5},
}

export function effMult(moveType: string, defTypes: string[]) {
  if (!moveType || moveType === "—") return 1
  return defTypes.reduce((m, d) => m * (CHART[moveType]?.[d] ?? 1), 1)
}

export function effLabel(m: number) {
  if (m === 0) return { t: "Inmune", cls: "immune" }
  if (m >= 2) return { t: m > 2 ? "x4" : "Súper eficaz", cls: "super" }
  if (m > 0 && m < 1) return { t: m < 0.5 ? "x¼" : "Poco eficaz", cls: "weak" }
  return null
}

export function hpColor(pct: number) {
  return pct > 50 ? "var(--emerald-400)" : pct > 20 ? "var(--amber-400)" : "var(--rose-500)"
}

export const STATUS_LABELS: Record<string, string> = {
  brn: "QUE", par: "PAR", psn: "ENV", tox: "TOX", slp: "DOR", frz: "CON", fnt: "DEB",
}

export const BOOST_NAMES: Record<string, string> = {
  atk: "Atq", def: "Def", spa: "AtE", spd: "DeE", spe: "Vel",
}

export const CAT_LABELS: Record<string, [string, string]> = {
  phys: ["Físico", "phys"],
  spec: ["Especial", "spec"],
  status: ["Estado", "status"],
}
