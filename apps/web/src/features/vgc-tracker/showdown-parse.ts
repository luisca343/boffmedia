import type { PresetSlot } from './types';

function toSpeciesId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseShowdownPaste(paste: string): PresetSlot[] {
  const blocks = paste.trim().split(/\n\s*\n/).filter(Boolean);
  const slots: PresetSlot[] = [];

  blocks.slice(0, 6).forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;

    // First line: "Nickname (Species) @ Item"  or  "Species @ Item"  or  "Species"
    const firstLine = lines[0];
    const atIdx = firstLine.indexOf(' @ ');
    const withItem = atIdx !== -1 ? firstLine.slice(0, atIdx) : firstLine;
    const item = atIdx !== -1 ? firstLine.slice(atIdx + 3).trim() : undefined;

    // Strip trailing gender marker — "(F)" or "(M)" are not species names.
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
    let teraType: string | undefined;
    const moves: string[] = [];

    for (const line of lines.slice(1)) {
      if (line.startsWith('Ability:')) {
        ability = line.slice(8).trim();
      } else if (line.startsWith('Tera Type:')) {
        teraType = line.slice(10).trim();
      } else if (line.endsWith(' Nature')) {
        nature = line.slice(0, -7).trim();
      } else if (line.startsWith('- ')) {
        moves.push(line.slice(2).trim());
      }
    }

    slots.push({
      slotIndex: idx as PresetSlot['slotIndex'],
      speciesId: toSpeciesId(speciesName),
      speciesName,
      nickname,
      item,
      ability,
      moves,
      nature,
      teraType,
    });
  });

  return slots;
}

export function isValidPaste(paste: string): boolean {
  return parseShowdownPaste(paste).length > 0;
}
