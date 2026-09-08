import { parseVgcPastesCsv } from './vgcpastes.service';

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function makeSheet(featured: boolean): string {
  const header = Array<string>(46).fill('');
  const row = Array<string>(46).fill('');
  const slotStart = featured ? 6 : 5;
  const fixed = featured
    ? {
        category: 1,
        teamDescription: 2,
        fullName: 4,
        pokepaste: 24,
        evs: 25,
        status: 27,
        date: 29,
        tournament: 30,
        rank: 31,
        source: 32,
        owner: 35,
        species: 37,
      }
    : {
        category: -1,
        teamDescription: 1,
        fullName: 3,
        pokepaste: 23,
        evs: 24,
        status: 26,
        date: 28,
        tournament: 29,
        rank: 30,
        source: 31,
        owner: 34,
        species: 36,
      };

  header[0] = 'Team ID';
  if (featured) header[fixed.category] = 'Category';
  header[fixed.teamDescription] = 'Team Description';
  header[fixed.fullName] = 'Full Name';
  for (let i = 0; i < 6; i++) header[slotStart + i * 3] = String(i + 1);
  header[fixed.pokepaste] = 'Pokepaste';
  header[fixed.evs] = 'EVs';
  header[fixed.status - 1] = 'Extracted paste?';
  header[fixed.status] = featured ? 'Rental Status' : 'Replica Status';
  header[fixed.status + 1] = featured
    ? 'Rental Code\n(Click text for image)'
    : 'Replica Code\n(Click text for image)';
  header[fixed.date] = 'Date Shared';
  header[fixed.tournament] = 'Tournament / Event';
  header[fixed.rank] = 'Rank';
  header[fixed.source] = 'Link to Source';
  header[fixed.source + 1] = 'Report / Video';
  header[fixed.source + 2] = 'Other Links';
  header[fixed.owner] = 'Owner';
  header[fixed.species] = 'Pokemon Text for Copypasta';

  row[0] = featured ? 'MB861' : 'PC476';
  if (featured) row[fixed.category] = 'In Person Event';
  row[fixed.teamDescription] = 'A team, with commas';
  row[fixed.fullName] = 'Player Name';
  for (let i = 0; i < 6; i++) {
    row[slotStart + i * 3 + 1] = `Item ${i + 1}`;
    row[fixed.species + i] = `Pokemon ${i + 1}`;
  }
  row[fixed.pokepaste] = 'https://pokepast.es/example';
  row[fixed.evs] = 'Yes';
  row[fixed.status] = featured ? "Owner's" : '✔';
  row[fixed.status + 1] = featured ? 'RENTALCODE' : 'REPLICACODE';
  row[fixed.date] = '31 Aug 2026';
  row[fixed.tournament] = 'Worlds 2026';
  row[fixed.rank] = 'Champion';
  row[fixed.source] = 'https://example.test/source';
  row[fixed.owner] = 'owner';

  return toCsv([['Metadata', 'ignored'], header, row]);
}

describe('parseVgcPastesCsv', () => {
  it('parses the regular VGCPastes layout', () => {
    const [team] = parseVgcPastesCsv(makeSheet(false));

    expect(team).toMatchObject({
      teamId: 'PC476',
      category: null,
      playerName: 'Player Name',
      pasteUrl: 'https://pokepast.es/example',
      replicaStatus: '✔',
      tournament: 'Worlds 2026',
    });
    expect(team.species).toEqual([
      'Pokemon 1',
      'Pokemon 2',
      'Pokemon 3',
      'Pokemon 4',
      'Pokemon 5',
      'Pokemon 6',
    ]);
    expect(team.items).toEqual([
      'Item 1',
      'Item 2',
      'Item 3',
      'Item 4',
      'Item 5',
      'Item 6',
    ]);
  });

  it('parses the featured-teams layout and maps Rental Status', () => {
    const [team] = parseVgcPastesCsv(makeSheet(true));

    expect(team).toMatchObject({
      teamId: 'MB861',
      category: 'In Person Event',
      teamDescription: 'A team, with commas',
      replicaStatus: "Owner's",
      rank: 'Champion',
    });
    expect(team.items).toEqual([
      'Item 1',
      'Item 2',
      'Item 3',
      'Item 4',
      'Item 5',
      'Item 6',
    ]);
  });
});
