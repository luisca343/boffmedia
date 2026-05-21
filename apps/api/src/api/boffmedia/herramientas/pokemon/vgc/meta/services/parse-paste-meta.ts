import { VgcMetaSlot, StatSpread } from '@/_db/schema/Vgc';

function toSpeciesId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseSpread(line: string): StatSpread | undefined {
  // Accepts "10 HP / 32 Atk / 0 Def / 0 SpA / 16 SpD / 8 Spe"
  const statMap: Record<string, keyof StatSpread> = {
    HP: 'hp',
    Atk: 'atk',
    Def: 'def',
    SpA: 'spa',
    SpD: 'spd',
    Spe: 'spe',
  };
  const result: Partial<StatSpread> = {};
  for (const pair of line.split('/').map((s) => s.trim())) {
    const m = pair.match(/^(\d+)\s+(\S+)$/);
    if (m) {
      const key = statMap[m[2]];
      if (key) result[key] = parseInt(m[1], 10);
    }
  }
  if (Object.keys(result).length === 0) return undefined;
  return {
    hp: result.hp ?? 0,
    atk: result.atk ?? 0,
    def: result.def ?? 0,
    spa: result.spa ?? 0,
    spd: result.spd ?? 0,
    spe: result.spe ?? 0,
  };
}

/**
 * Meta-specific paste parser â€” identical to the tracker's parseShowdownPaste but
 * also captures the EVs/SPs line into `slot.spread`. Tracker types are not touched.
 */
export function parsePasteMeta(paste: string): VgcMetaSlot[] {
  const blocks = paste
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  const slots: VgcMetaSlot[] = [];

  blocks.slice(0, 6).forEach((block, idx) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;

    const firstLine = lines[0];
    const atIdx = firstLine.indexOf(' @ ');
    const withItem = atIdx !== -1 ? firstLine.slice(0, atIdx) : firstLine;
    const item = atIdx !== -1 ? firstLine.slice(atIdx + 3).trim() : undefined;
    const withItemNoGender = withItem.replace(/\s*\([FM]\)\s*$/, '').trim();

    let speciesName: string;
    let nickname: string | undefined;
    const nicknameMatch = withItemNoGender.match(/^(.+?)\s*\((.+?)\)$/);
    if (nicknameMatch) {
      nickname = nicknameMatch[1].trim();
      speciesName = nicknameMatch[2].trim();
    } else {
      speciesName = withItemNoGender;
    }

    let ability: string | undefined;
    let nature: string | undefined;
    let spread: StatSpread | undefined;
    const moves: string[] = [];

    for (const line of lines.slice(1)) {
      if (line.startsWith('Ability:')) {
        ability = line.slice(8).trim();
      } else if (line.startsWith('EVs:')) {
        spread = parseSpread(line.slice(4).trim());
      } else if (line.endsWith(' Nature')) {
        nature = line.slice(0, -7).trim();
      } else if (line.startsWith('- ')) {
        moves.push(line.slice(2).trim());
      }
    }

    slots.push({
      slotIndex: idx as VgcMetaSlot['slotIndex'],
      speciesId: toSpeciesId(speciesName),
      speciesName,
      nickname,
      item,
      ability,
      moves,
      nature,
      spread,
    });
  });

  return slots;
}
