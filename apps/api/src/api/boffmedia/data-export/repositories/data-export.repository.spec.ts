import { Test, TestingModule } from '@nestjs/testing';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

import { EXPORTED_TABLES, type ExportSubject } from '../data-export.manifest';
import { DataExportRepository } from './data-export.repository';

/**
 * `collect` is the one place where a wrong `WHERE` puts other people's rows in
 * somebody's archive, so these tests are about the clause that is NOT built.
 */

const rows: { value: Record<string, unknown>[] } = { value: [] };

const chain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn(() => Promise.resolve(rows.value)),
};
const db = { select: jest.fn(() => chain) };

const subject = (over: Partial<ExportSubject> = {}): ExportSubject => ({
  accountId: 1,
  mcUuid: null,
  discordId: null,
  email: 'a@example.com',
  participantIds: [],
  documentIds: [],
  sharexTokenIds: [],
  bankAccountIds: [],
  orderIds: [],
  chatIds: [],
  listingIds: [],
  mineGameIds: [],
  ...over,
});

const spec = (table: string) => {
  const found = EXPORTED_TABLES.find((t) => t.table === table);
  if (!found) throw new Error(`manifest has no entry for ${table}`);
  return found;
};

describe('DataExportRepository.collect', () => {
  let repo: DataExportRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    rows.value = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [DataExportRepository, { provide: DRIZZLE, useValue: db }],
    }).compile();

    repo = module.get(DataExportRepository);
  });

  it('issues no query at all when the account has no Minecraft identity', async () => {
    // The trap: `WHERE uuid = NULL` matches nothing, but a clause list that
    // collapses to empty leaves `.where(undefined)` — an unfiltered scan, and
    // every other player's rows in this person's archive.
    const result = await repo.collect(spec('rotom_pokedex'), subject());

    expect(result).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('issues no query when the derived id set is empty', async () => {
    const result = await repo.collect(
      spec('boffmedia_participant_progress'),
      subject({ participantIds: [] }),
    );

    expect(result).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('queries once the key resolves', async () => {
    rows.value = [{ uuid: 'u', pokemonId: 25 }];

    const result = await repo.collect(
      spec('rotom_pokedex'),
      subject({ mcUuid: '11111111-2222-3333-4444-555555555555' }),
    );

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('strips the redacted columns from every row', async () => {
    rows.value = [
      { id: 1, userId: 7, opponentUserId: 9, log: 'x' },
      { id: 2, userId: 7, opponentUserId: 11, log: 'y' },
    ];

    const result = await repo.collect(
      spec('tools_battlesim_replays'),
      subject({ accountId: 7 }),
    );

    for (const replay of result) {
      expect(replay).not.toHaveProperty('opponentUserId');
      expect(replay).toHaveProperty('log');
    }
  });

  it('leaves rows untouched where the manifest asks for no redaction', async () => {
    rows.value = [{ id: 1, userId: 7, name: 'my team' }];

    const [team] = await repo.collect(
      spec('tools_battlesim_teams'),
      subject({ accountId: 7 }),
    );

    expect(team).toEqual({ id: 1, userId: 7, name: 'my team' });
  });
});
