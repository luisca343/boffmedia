// Demo data for the Calendario chapter — the calendar reuses the Catálogo dataset
// (real Steam covers/metadata), not yet wired to the v3 design system. Platforms
// and genre are assigned here so the month/week/timeline views populate. [deferred]
import type { LzPlatformKey, LzRelease } from "@/components/boffmedia/ui/calendar"

type Row = [string, string | null, number, LzPlatformKey[], string, string?]

const RAW: Row[] = [
  ["Elden Ring", "2026-05-22", 5, ["ps5", "xbox", "pc"], "RPG"],
  ["Forza Horizon 5", "2026-05-22", 3, ["xbox", "pc"], "Carreras"],
  ["Resident Evil 4 Remake", "2026-05-26", 4, ["ps5", "xbox", "pc"], "Terror"],
  ["XCOM 2", "2026-05-29", 3, ["pc", "ps5", "xbox"], "Estrategia"],
  ["Ghost of Tsushima", "2026-06-02", 4, ["ps5", "pc"], "Acción"],
  ["Stardew Valley", "2026-06-05", 2, ["pc", "switch", "mobile"], "Simulación"],
  ["DOOM Eternal", "2026-06-09", 4, ["ps5", "xbox", "pc", "switch"], "Shooter"],
  ["The Witcher 3: Wild Hunt", "2026-06-12", 5, ["ps5", "xbox", "pc", "switch"], "RPG"],
  ["Cuphead", "2026-06-12", 2, ["pc", "switch", "xbox"], "Plataformas"],
  ["Gran Turismo 7", "2026-06-16", 3, ["ps5"], "Carreras"],
  ["Baldur's Gate 3", "2026-06-17", 5, ["ps5", "xbox", "pc"], "RPG"],
  ["Red Dead Redemption 2", "2026-06-18", 5, ["ps5", "xbox", "pc"], "Mundo abierto"],
  ["Armored Core VI", "2026-06-18", 4, ["ps5", "xbox", "pc"], "Acción"],
  ["Tunic", "2026-06-19", 3, ["pc", "switch", "ps5", "xbox"], "Aventura"],
  ["Dead Cells", "2026-06-23", 3, ["pc", "switch", "ps5", "mobile"], "Roguelike"],
  ["Sekiro: Shadows Die Twice", "2026-06-25", 4, ["ps5", "xbox", "pc"], "Acción"],
  ["Hades", "2026-06-26", 4, ["pc", "switch", "ps5", "xbox"], "Roguelike"],
  ["Tony Hawk's Pro Skater 1+2", "2026-06-30", 3, ["ps5", "xbox", "pc", "switch"], "Deportes"],
  ["Resident Evil Village", "2026-07-02", 4, ["ps5", "xbox", "pc"], "Terror"],
  ["No Man's Sky", "2026-07-03", 3, ["ps5", "xbox", "pc", "switch"], "Aventura"],
  ["Final Fantasy VII Rebirth", "2026-07-07", 5, ["ps5", "pc"], "RPG"],
  ["Rocket League", "2026-07-10", 4, ["ps5", "xbox", "pc", "switch"], "Deportes"],
  ["Hollow Knight", "2026-07-14", 4, ["pc", "switch", "ps5", "xbox"], "Metroidvania"],
  ["Frostpunk 2", "2026-07-17", 3, ["pc", "ps5", "xbox"], "Estrategia"],
  ["Nier: Automata", "2026-07-21", 4, ["ps5", "xbox", "pc", "switch"], "Acción"],
  ["Helldivers 2", "2026-07-24", 3, ["ps5", "pc"], "Shooter"],
  ["God of War Ragnarök", "2026-07-28", 5, ["ps5", "pc"], "Acción"],
  ["Sifu", "2026-07-31", 2, ["ps5", "xbox", "pc", "switch"], "Lucha"],
  ["Horizon Forbidden West", "2026-08-04", 4, ["ps5", "pc"], "Mundo abierto"],
  ["Cyberpunk 2077", "2026-08-07", 5, ["ps5", "xbox", "pc"], "RPG"],
  ["Remnant II", "2026-08-11", 3, ["ps5", "xbox", "pc"], "Shooter"],
  ["Vampire Survivors", "2026-08-14", 2, ["pc", "switch", "mobile", "xbox"], "Roguelike"],
  ["Divinity: Original Sin 2", "2026-08-18", 4, ["pc", "ps5", "switch"], "RPG"],
  ["Celeste", "2026-08-21", 4, ["pc", "switch", "ps5", "xbox"], "Plataformas"],
  ["Apex Legends", "2026-08-25", 3, ["ps5", "xbox", "pc", "switch"], "Battle Royale"],
  ["Alan Wake 2", "2026-08-28", 4, ["ps5", "xbox", "pc"], "Terror"],
  ["Metaphor: ReFantazio", "2026-09-01", 5, ["ps5", "xbox", "pc"], "RPG"],
  ["EA Sports FC 24", "2026-09-04", 2, ["ps5", "xbox", "pc", "switch"], "Deportes"],
  ["Returnal", "2026-09-08", 4, ["ps5", "pc"], "Shooter"],
  ["Inside", "2026-09-11", 3, ["pc", "switch", "ps5", "xbox"], "Puzzle"],
  ["Persona 5 Royal", "2026-09-15", 5, ["ps5", "switch", "pc", "xbox"], "RPG"],
  // TBA
  ["Hollow Knight: Silksong", null, 5, ["pc", "switch", "ps5", "xbox"], "Metroidvania", "Q4 2026"],
  ["Path of Exile 2", null, 4, ["pc", "ps5", "xbox"], "RPG", "2026"],
  ["Hades II", null, 4, ["pc", "switch"], "Roguelike", "Q4 2026"],
  ["Palworld", null, 4, ["pc", "xbox"], "Sandbox", "2027"],
]

export const LZ_RELEASES: LzRelease[] = RAW.map(([title, date, hype, platforms, genre, window], i) => ({
  id: i + 1,
  title,
  date,
  hype,
  platforms,
  genre,
  window: window || null,
}))
