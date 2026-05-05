import { Generations } from '@smogon/calc'
import type { CalcPokemon, MoveSlots, StatValues } from '../_types/calculator'
import { defaultPokemon } from '../_store/calculatorStore'

const GEN9 = Generations.get(9)

const NATURES = new Set([
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
])

const STAT_MAP: Record<string, keyof StatValues> = {
  hp: 'hp', atk: 'atk', def: 'def', spa: 'spa', spd: 'spd', spe: 'spe',
}

function normalizeStat(raw: string): keyof StatValues | null {
  return STAT_MAP[raw.toLowerCase()] ?? null
}

export function parsePokePaste(text: string): CalcPokemon[] {
  const blocks = text.trim().split(/\n\s*\n+/)
  const result: CalcPokemon[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) continue

    const poke: CalcPokemon = {
      ...defaultPokemon('Miraidon'),
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      moves: [
        { name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false },
        { name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false },
        { name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false },
        { name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false },
      ] as MoveSlots,
    }

    // ── Line 0: Name @ Item  (or  Nickname (Name) @ Item) ────────────────────
    const line0 = lines[0]
    const itemMatch = line0.match(/@\s*(.+)$/)
    if (itemMatch) poke.item = itemMatch[1].trim()

    let namePart = line0.replace(/@.*$/, '').trim()
    // Strip nickname parentheses
    const nicknameMatch = namePart.match(/\(([^)]+)\)\s*$/)
    if (nicknameMatch) namePart = nicknameMatch[1].trim()
    // Strip gender markers
    namePart = namePart.replace(/\s*\([MF]\)\s*/g, '').trim()

    // Trust the species name from the paste as-is — canonical name normalization
    // happens at the call site (MatrixView's PasteImportModal) via toId matching.
    if (!namePart) continue
    poke.name = namePart

    // Ability will be filled in by the "Ability:" line in the paste, or by the
    // caller when normalizing against the legal Pokémon list.

    // ── Remaining lines ───────────────────────────────────────────────────────
    let moveIdx = 0
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i]

      if (l.startsWith('Ability:')) {
        poke.ability = l.replace('Ability:', '').trim()
      } else if (l.startsWith('Level:')) {
        poke.level = parseInt(l.replace('Level:', '').trim()) || 50
      } else if (l.startsWith('EVs:')) {
        for (const part of l.replace('EVs:', '').trim().split('/')) {
          const m = part.trim().match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i)
          if (m) {
            const key = normalizeStat(m[2])
            if (key) poke.evs[key] = Math.min(252, parseInt(m[1]))
          }
        }
      } else if (l.startsWith('IVs:')) {
        for (const part of l.replace('IVs:', '').trim().split('/')) {
          const m = part.trim().match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i)
          if (m) {
            const key = normalizeStat(m[2])
            if (key) poke.ivs[key] = Math.min(31, parseInt(m[1]))
          }
        }
      } else if (l.includes('Nature')) {
        const natMatch = l.match(/^(\w+)\s+Nature/)
        if (natMatch && NATURES.has(natMatch[1])) poke.nature = natMatch[1]
      } else if (l.startsWith('Tera Type:')) {
        poke.teraType = l.replace('Tera Type:', '').trim()
      } else if ((l.startsWith('-') || l.startsWith('–')) && moveIdx < 4) {
        const mvName = l.replace(/^[-–]\s*/, '').trim()
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const moveEntry = GEN9.moves.get(mvName as any)
          if (moveEntry) {
            poke.moves[moveIdx] = {
              name: moveEntry.name,
              bp: moveEntry.basePower,
              type: moveEntry.type as string,
              category: moveEntry.category as 'Physical' | 'Special' | 'Status',
              crit: false,
            }
          }
        } catch {
          // unknown move — leave slot empty
        }
        moveIdx++
      }
    }

    result.push(poke)
  }

  return result
}
