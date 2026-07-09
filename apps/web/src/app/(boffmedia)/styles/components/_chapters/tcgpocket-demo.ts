// Demo cards + odds rows for the TCG Pocket showcase. Real cards arrive from the
// API (TcgCard); here we cast minimal literals to feed the real TcgCardFace /
// TcgOddsTable specimens. Art falls back to the CSS placeholder. [deferred]
import type { TcgCard } from "@boffmedia/shared"
import type { OddsTableRow } from "@/app/(boffmedia)/(herramientas)/pokemon/tcgpocket/_components/tcgp-kit"

const card = (c: {
  id: string; localId: string; name: string; rarity: string; setId: string
  types?: string[]; hp?: number; stage?: string
}): TcgCard => ({ category: "Pokemon", ...c }) as unknown as TcgCard

export const DEMO_CARDS: TcgCard[] = [
  card({ id: "a1-003", localId: "003", name: "Venusaur ex", rarity: "Four Diamond", setId: "A1", types: ["grass"], hp: 190, stage: "Stage2" }),
  card({ id: "a3-016", localId: "016", name: "Charizard", rarity: "Three Diamond", setId: "A3", types: ["fire"], hp: 180, stage: "Stage2" }),
  card({ id: "a1-020", localId: "020", name: "Blastoise", rarity: "Two Star", setId: "A1", types: ["water"], hp: 150, stage: "Stage2" }),
  card({ id: "a2-014", localId: "014", name: "Gardevoir", rarity: "One Star", setId: "A2", types: ["psychic"], hp: 130, stage: "Stage2" }),
]

export const DEMO_ODDS: OddsTableRow[] = [
  { pack: "Choque Genético · Mewtwo", setCode: "A1", perSlot: [0.02, 0.02, 0.02, 0.052, 0.166], aggregate: 0.281, best: true },
  { pack: "Choque Genético · Charizard", setCode: "A1", perSlot: [0.02, 0.02, 0.02, 0.05, 0.16], aggregate: 0.264 },
  { pack: "Isla Fabulosa · Mew", setCode: "A1a", perSlot: [0.014, 0.014, 0.014, 0.043, 0.129], aggregate: 0.208 },
  { pack: "Luz Triunfal · Arceus", setCode: "A2b", perSlot: [0.011, 0.011, 0.011, 0.035, 0.108], aggregate: 0.174 },
]
