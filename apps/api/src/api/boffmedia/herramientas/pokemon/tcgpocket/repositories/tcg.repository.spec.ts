import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { TcgRepository } from './tcg.repository';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { tcgCards, tcgSets } from '@/_db/schema/Tcg';

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

/**
 * Drizzle matches `values()` against the table's JS property names, so a row
 * built with the external API's snake_case keys writes `default` into every
 * column it fails to match — silently, until MySQL rejects a NOT NULL. These
 * tests assert the mapping by looking at the keys the repository hands Drizzle.
 */
describe('TcgRepository — row mapping', () => {
  let repository: TcgRepository;
  let insertedInto: any;
  let insertedRows: any[];

  const db = {
    execute: jest.fn(),
    select: jest.fn(),
    insert: jest.fn((table: any) => {
      insertedInto = table;
      return {
        values: (rows: any[]) => {
          insertedRows = rows;
          return {
            onDuplicateKeyUpdate: jest.fn().mockResolvedValue(undefined),
            then: (resolve: any) => resolve(undefined),
          };
        },
      };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    insertedRows = [];

    // `upsertCards`/`upsertSets` read the existing ids first.
    db.select.mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgRepository,
        { provide: Logger, useValue: mockLogger },
        { provide: DRIZZLE, useValue: db },
      ],
    }).compile();

    repository = module.get<TcgRepository>(TcgRepository);
  });

  const apiCard = {
    id: 'P-A-001',
    set_id: 'P-A',
    local_id: '1',
    name_en: 'Poké Ball',
    name_es: 'Poké Ball',
    image_local_en: null,
    image_local_es: null,
    category: 'Trainer',
    illustrator: '5ban Graphics',
    rarity: 'None',
    hp: null,
    stage: null,
    description_en: 'Put 1 random Basic Pokémon from your deck into your hand.',
    description_es: 'Pon 1 Pokémon Básico al azar de tu baraja en tu mano.',
    updated: new Date('2025-05-17T22:53:26.000Z'),
    types: null,
    weaknesses: null,
    attacks: null,
    boosters: null,
    variants: '{"normal":true}',
    legal: '{"standard":false}',
    retreat: null,
  };

  const apiSet = {
    id: 'P-A',
    series_id: 'tcgp',
    name_en: 'Promos-A',
    name_es: 'Promos-A',
    logo: 'https://assets.tcgdex.net/en/tcgp/P-A/logo',
    symbol: null,
    card_count_official: 0,
    card_count_total: 100,
  };

  it('maps snake_case card fields onto the schema property names', async () => {
    await repository.upsertCards([apiCard]);

    expect(insertedInto).toBe(tcgCards);
    expect(insertedRows[0]).toEqual(
      expect.objectContaining({
        id: 'P-A-001',
        setId: 'P-A',
        localId: '1',
        nameEn: 'Poké Ball',
        nameEs: 'Poké Ball',
        descriptionEn: expect.stringContaining('Basic Pokémon'),
        descriptionEs: expect.stringContaining('Pokémon Básico'),
      }),
    );
    // The snake_case keys must not survive: Drizzle would ignore them and the
    // column would silently fall back to `default`.
    expect(insertedRows[0]).not.toHaveProperty('set_id');
    expect(insertedRows[0]).not.toHaveProperty('name_en');
  });

  it('never leaves a NOT NULL card column undefined', async () => {
    await repository.upsertCards([apiCard]);

    for (const column of ['id', 'setId', 'nameEn', 'nameEs']) {
      expect(insertedRows[0][column]).toBeDefined();
    }
  });

  it('maps snake_case set fields onto the schema property names', async () => {
    await repository.upsertSets([apiSet]);

    expect(insertedInto).toBe(tcgSets);
    expect(insertedRows[0]).toEqual({
      id: 'P-A',
      seriesId: 'tcgp',
      nameEn: 'Promos-A',
      nameEs: 'Promos-A',
      logo: 'https://assets.tcgdex.net/en/tcgp/P-A/logo',
      symbol: null,
      cardCountOfficial: 0,
      cardCountTotal: 100,
    });
  });

  it('accepts rows that already use the schema property names', async () => {
    await repository.upsertCards([
      { id: 'A1-001', setId: 'A1', nameEn: 'Bulbasaur', nameEs: 'Bulbasaur' },
    ]);

    expect(insertedRows[0]).toEqual(
      expect.objectContaining({
        setId: 'A1',
        nameEn: 'Bulbasaur',
        nameEs: 'Bulbasaur',
      }),
    );
  });

  it('repoints artwork paths left over from the pre-reorg public/ layout', async () => {
    // The files never moved names, only the prefix that serves them - so this is
    // a string swap, not a re-download.
    db.execute.mockResolvedValue([{ affectedRows: 40 }]);

    const fixed = await repository.repairLegacyImagePaths();

    expect(fixed).toBe(80); // both locale columns
    expect(db.execute).toHaveBeenCalledTimes(2);

    // Render the SQL rather than trusting that a mock was called: `sql.raw` for
    // the column and bound params for the prefixes is exactly the part that can
    // compose wrongly and still type-check.
    const dialect = new MySqlDialect();
    const rendered = db.execute.mock.calls.map((c: any[]) =>
      dialect.sqlToQuery(c[0]),
    );

    expect(rendered[0].sql).toContain(
      'SET image_local_en = REPLACE(image_local_en, ?, ?)',
    );
    expect(rendered[0].sql).toContain('WHERE image_local_en LIKE ?');
    expect(rendered[0].params).toEqual([
      '/img/games/tcg/',
      '/boffmedia/tools/tcg/',
      '/img/games/tcg/%',
    ]);
    expect(rendered[1].sql).toContain('image_local_es');
  });

  it('maps the same way on the insert-only path', async () => {
    db.select.mockReturnValue({ from: () => Promise.resolve([]) });

    await repository.insertCards([apiCard]);

    expect(insertedRows[0]).toEqual(
      expect.objectContaining({ setId: 'P-A', nameEn: 'Poké Ball' }),
    );
  });
});
