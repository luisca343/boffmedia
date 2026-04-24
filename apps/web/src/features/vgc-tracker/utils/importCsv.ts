import type { Match, MatchSlot, MatchNote, MatchResult, MatchFormat, SlotRole } from '../types';

// ─── CSV helpers ─────────────────────────────────────────────────────────────

/**
 * Full RFC-4180-compatible CSV parser.
 * Handles multi-line quoted fields (e.g. notes with embedded newlines).
 * Also handles "" as an escaped quote inside a quoted field.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else if (ch === '\r' && text[i + 1] === '\n' && !inQuotes) {
      i++;
      fields.push(current);
      current = '';
      rows.push(fields);
      fields = [];
    } else if (ch === '\n' && !inQuotes) {
      fields.push(current);
      current = '';
      rows.push(fields);
      fields = [];
    } else {
      current += ch;
    }
  }
  // Flush last row
  if (current || fields.length > 0) {
    fields.push(current);
    if (fields.some((f) => f !== '')) rows.push(fields);
  }

  return rows;
}

/** European decimal notation: "1.741,014" or "1741,014" or "+19,82" → number */
function parseEuro(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/\./g, '').replace(',', '.').replace('+', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

/** "AEGISLASH-SHIELD" → "Aegislash-Shield" */
function titleCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-');
}

/** Matches how usePokemonSearch computes speciesId: lowercase, strip non-alphanumeric */
function toSpeciesId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Some CSV names don't match Pokémon Showdown's species IDs.
 * Keys are the raw toSpeciesId() output; values are the canonical PS name.
 */
const NAME_OVERRIDES: Record<string, { name: string; id: string }> = {
  basculegionmale:      { name: 'Basculegion',    id: 'basculegion' },
  mausholdfamilyoffour: { name: 'Maushold-Four',  id: 'mausholdfour' },
  sinistchaunremarkable:{ name: 'Sinistcha',       id: 'sinistcha' },
};

function normalizeSpecies(csvName: string): { name: string; id: string } {
  const raw = toSpeciesId(titleCase(csvName.trim()));
  const override = NAME_OVERRIDES[raw];
  if (override) return override;
  const name = titleCase(csvName.trim());
  return { name, id: toSpeciesId(name) };
}

function makeSlot(index: 0 | 1 | 2 | 3 | 4 | 5, csvName: string, role: SlotRole): MatchSlot {
  const { name, id } = normalizeSpecies(csvName);
  return { slotIndex: index, speciesId: id, speciesName: name, role };
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * CSV column layout (0-indexed):
 *  0  Rival          — opponent name
 *  1  Rango Rival    — opponent ELO
 *  2  RANGO          — my ELO after the match
 *  3  Diff           — ELO delta (positive = win, negative = loss)
 *  4  Lead 1         — my lead 1
 *  5  Lead 2         — my lead 2
 *  6  Back 1         — my back 1
 *  7  Back 2         — my back 2
 *  8-13 R Pick 1-6   — opponent's 6-pick pool
 * 14  R Lead 1       — opponent lead 1
 * 15  R Lead 2       — opponent lead 2
 * 16  R Back 1       — opponent back 1
 * 17  R Back 2       — opponent back 2
 * 18-23 Pick 1-6     — my 6-pick pool (may be absent in some rows)
 * 24  Notas          — post-match notes
 */
export function parseMatchCsv(
  csvText: string,
  sessionId: string,
  format: MatchFormat,
  startDate: Date = new Date(),
  minsPerMatch: number = 10,
): Match[] {
  const allRows = parseCsv(csvText);

  // First two rows are header rows (group headers + column names)
  const dataRows = allRows.slice(2).filter((r) => r.some((f) => f.trim() !== ''));
  if (dataRows.length === 0) return [];

  const base = startDate.getTime();

  return dataRows.map((c, rowIdx) => {
    // ── Result ───────────────────────────────────────────────────────────
    const diff = parseEuro(c[3]);
    const result: MatchResult =
      diff === undefined ? 'draw' : diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw';

    // ── My team ──────────────────────────────────────────────────────────
    const myAssigned: [string, SlotRole][] = (
      [
        [c[4], 'lead1'],
        [c[5], 'lead2'],
        [c[6], 'back1'],
        [c[7], 'back2'],
      ] as [string, SlotRole][]
    ).filter(([n]) => n?.trim());

    const myPoolRaw = [c[18], c[19], c[20], c[21], c[22], c[23]].filter((n) => n?.trim());

    let mySlots: MatchSlot[];
    if (myPoolRaw.length > 0) {
      const assignedMap = new Map<string, SlotRole>(
        myAssigned.map(([n, role]) => [normalizeSpecies(n).id, role]),
      );
      mySlots = myPoolRaw.map((name, si) =>
        makeSlot(si as 0 | 1 | 2 | 3 | 4 | 5, name!, assignedMap.get(normalizeSpecies(name!).id) ?? 'unknown'),
      );
    } else {
      mySlots = myAssigned.map(([name, role], si) =>
        makeSlot(si as 0 | 1 | 2 | 3 | 4 | 5, name, role),
      );
    }

    // ── Opponent team ─────────────────────────────────────────────────────
    const oppPoolRaw = [c[8], c[9], c[10], c[11], c[12], c[13]].filter((n) => n?.trim());
    const oppAssigned: [string, SlotRole][] = (
      [
        [c[14], 'lead1'],
        [c[15], 'lead2'],
        [c[16], 'back1'],
        [c[17], 'back2'],
      ] as [string, SlotRole][]
    ).filter(([n]) => n?.trim());

    const oppAssignedMap = new Map<string, SlotRole>(
      oppAssigned.map(([n, role]) => [normalizeSpecies(n).id, role]),
    );
    const oppSlots: MatchSlot[] = oppPoolRaw.map((name, si) =>
      makeSlot(si as 0 | 1 | 2 | 3 | 4 | 5, name!, oppAssignedMap.get(normalizeSpecies(name!).id) ?? 'unknown'),
    );

    // ── Notes ─────────────────────────────────────────────────────────────
    const noteText = c[24]?.trim();
    const notes: MatchNote[] = noteText
      ? noteText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line, i) => ({
            id: crypto.randomUUID(),
            text: line,
            createdAt: base + rowIdx * minsPerMatch * 60_000 + 1 + i,
            phase: 'live' as const,
          }))
      : [];

    // ── Timestamps ───────────────────────────────────────────────────────
    const createdAt = base + rowIdx * minsPerMatch * 60_000;

    return {
      id: crypto.randomUUID(),
      sessionId,
      format,
      createdAt,
      completedAt: createdAt + 1,
      myTeam: { slots: mySlots },
      opponentTeam: { slots: oppSlots },
      opponentName: c[0]?.trim() || undefined,
      result,
      eloAfter: parseEuro(c[2]),
      opponentElo: parseEuro(c[1]),
      notes,
    };
  });
}
