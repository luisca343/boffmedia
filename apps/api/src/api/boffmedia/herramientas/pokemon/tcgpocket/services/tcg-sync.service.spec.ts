import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { TcgSyncService, TcgSyncEvent } from './tcg-sync.service';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockFetchService = {
  fetchAndMergeSeries: jest.fn(),
  fetchAndMergeSetsForSeries: jest.fn(),
  fetchAndMergeCardsForSet: jest.fn(),
  fetchCardImageUrlsForSet: jest.fn(),
};

const mockImageService = {
  downloadSetImages: jest.fn(),
  downloadCardImage: jest.fn(),
};

const mockRepository = {
  checkIfSeriesExists: jest.fn(),
  repairLegacyImagePaths: jest.fn(),
  getSetsBySeriesId: jest.fn(),
  getSyncStatsBySeries: jest.fn(),
  insertSeries: jest.fn(),
  upsertSets: jest.fn(),
  upsertCards: jest.fn(),
  getCardImageStateForSet: jest.fn(),
  updateCardImages: jest.fn(),
};

/** Remote catalogue: A1 with 3 cards, A2 with 2. */
const remoteSets = [
  { id: 'A1', name_en: 'Genetic Apex', card_count_total: 3 },
  { id: 'A2', name_en: 'Mythical Island', card_count_total: 2 },
];

const collect = async (
  gen: AsyncGenerator<TcgSyncEvent>,
): Promise<TcgSyncEvent[]> => {
  const events: TcgSyncEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
};

describe('TcgSyncService', () => {
  let service: TcgSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRepository.getSetsBySeriesId.mockResolvedValue([
      { id: 'A1', name_en: 'Genetic Apex', card_count_total: 3 },
      { id: 'A2', name_en: 'Mythical Island', card_count_total: 2 },
    ]);
    mockRepository.getSyncStatsBySeries.mockResolvedValue([
      { setId: 'A1', cards: 3, imagesEn: 3, imagesEs: 3, imagesAny: 3 }, // complete
      { setId: 'A2', cards: 1, imagesEn: 1, imagesEs: 0, imagesAny: 1 }, // partial
    ]);
    mockFetchService.fetchAndMergeSetsForSeries.mockResolvedValue(remoteSets);
    mockRepository.upsertSets.mockResolvedValue({ inserted: 0, updated: 2 });
    mockRepository.upsertCards.mockResolvedValue({ inserted: 2, updated: 0 });
    mockRepository.checkIfSeriesExists.mockResolvedValue(true);
    mockRepository.repairLegacyImagePaths.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgSyncService,
        { provide: Logger, useValue: mockLogger },
        { provide: TcgFetchService, useValue: mockFetchService },
        { provide: TcgImageService, useValue: mockImageService },
        { provide: TCGPOCKET_REPOSITORY_TOKEN, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TcgSyncService>(TcgSyncService);
  });

  describe('getStatus()', () => {
    it('classifies each set against the remote catalogue', async () => {
      const status = await service.getStatus('tcgp');

      expect(status.sets.find((s) => s.id === 'A1')?.state).toBe('ok');
      expect(status.sets.find((s) => s.id === 'A2')?.state).toBe(
        'cards-partial',
      );
      expect(status.cardsInDb).toBe(4);
      expect(status.cardsRemote).toBe(5);
    });

    it('flags a set whose cards are all stored but whose artwork is not', async () => {
      mockRepository.getSyncStatsBySeries.mockResolvedValue([
        { setId: 'A1', cards: 3, imagesEn: 1, imagesEs: 1, imagesAny: 1 },
      ]);

      const status = await service.getStatus('tcgp');
      const a1 = status.sets.find((s) => s.id === 'A1');

      expect(a1?.state).toBe('images-partial');
      expect(a1?.imagesMissing).toBe(2); // 3 cards, 1 of them with artwork
    });

    it('counts a card with only one locale as covered, not as missing', async () => {
      // tcgdex has no EN asset for many promos, so a set where every card has ES
      // artwork is complete - it must not read as half-done forever.
      mockRepository.getSyncStatsBySeries.mockResolvedValue([
        { setId: 'A1', cards: 3, imagesEn: 0, imagesEs: 3, imagesAny: 3 },
      ]);

      const status = await service.getStatus('tcgp');
      const a1 = status.sets.find((s) => s.id === 'A1');

      expect(a1?.imagesMissing).toBe(0);
      expect(a1?.state).toBe('ok');
    });

    it('degrades instead of throwing when the remote catalogue is down', async () => {
      mockFetchService.fetchAndMergeSetsForSeries.mockRejectedValue(
        new Error('ENOTFOUND api.tcgdex.net'),
      );

      const status = await service.getStatus('tcgp');

      expect(status.remoteAvailable).toBe(false);
      expect(status.remoteError).toContain('ENOTFOUND');
      expect(status.sets).toHaveLength(2); // local rows still reported
    });
  });

  describe('run()', () => {
    it('only runs the stages that were selected', async () => {
      const events = await collect(
        service.run({ seriesId: 'tcgp', sets: true }),
      );

      const stages = events
        .filter((e) => e.type === 'stage')
        .map((e: any) => e.stage);
      expect(new Set(stages)).toEqual(new Set(['sets']));
      expect(mockFetchService.fetchAndMergeCardsForSet).not.toHaveBeenCalled();
      expect(mockFetchService.fetchAndMergeSeries).not.toHaveBeenCalled();
    });

    it('does not touch artwork when images are not selected', async () => {
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([
        { id: 'A2-002' },
      ]);

      await collect(
        service.run({ seriesId: 'tcgp', sets: true, cards: true }),
      );

      expect(mockImageService.downloadSetImages).not.toHaveBeenCalled();
      expect(mockImageService.downloadCardImage).not.toHaveBeenCalled();
      expect(mockFetchService.fetchAndMergeCardsForSet).toHaveBeenCalledWith(
        'A2',
        expect.objectContaining({ withImages: false }),
      );
    });

    it('skips sets that are already complete, and re-walks them under force', async () => {
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);

      const events = await collect(service.run({ seriesId: 'tcgp', cards: true }));
      const skipped = events.filter(
        (e: any) => e.type === 'set' && e.state === 'skipped',
      );
      expect(skipped.map((e: any) => e.setId)).toEqual(['A1']);

      jest.clearAllMocks();
      mockRepository.getSetsBySeriesId.mockResolvedValue([{ id: 'A1' }]);
      mockRepository.getSyncStatsBySeries.mockResolvedValue([
        { setId: 'A1', cards: 3, imagesEn: 3, imagesEs: 3, imagesAny: 3 },
      ]);
      mockFetchService.fetchAndMergeSetsForSeries.mockResolvedValue(remoteSets);
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);
      mockRepository.upsertCards.mockResolvedValue({ inserted: 0, updated: 3 });

      await collect(service.run({ seriesId: 'tcgp', cards: true, force: true }));
      expect(mockFetchService.fetchAndMergeCardsForSet).toHaveBeenCalled();
    });

    it('honours an explicit set selection', async () => {
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);

      const events = await collect(
        service.run({ seriesId: 'tcgp', cards: true, setIds: ['A2'] }),
      );

      const start = events.find((e) => e.type === 'start') as any;
      expect(start.sets.map((s: any) => s.id)).toEqual(['A2']);
    });

    it('keeps going when one set fails, and reports it in the summary', async () => {
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]); // both sets empty
      mockFetchService.fetchAndMergeCardsForSet.mockImplementation(
        async (setId: string) => {
          if (setId === 'A1') throw new Error('502 from tcgdex');
          return [{ id: 'A2-001' }];
        },
      );

      const events = await collect(service.run({ seriesId: 'tcgp', cards: true }));

      const setEvents = events.filter((e: any) => e.type === 'set') as any[];
      expect(setEvents.find((e) => e.setId === 'A1' && e.state === 'error')).toBeDefined();
      expect(setEvents.find((e) => e.setId === 'A2' && e.state === 'done')).toBeDefined();

      const done = events[events.length - 1] as any;
      expect(done.type).toBe('done');
      expect(done.counts.failed).toBe(1);
      expect(done.failures).toEqual([
        { stage: 'cards', scope: 'A1', message: '502 from tcgdex' },
      ]);
    });

    it('creates the parent set row before writing cards for a set that was never imported', async () => {
      // Remote-only set: selectable on the status screen, but `tcg_cards.set_id`
      // is a foreign key, so its row has to exist first.
      mockRepository.getSetsBySeriesId.mockResolvedValue([]);
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]);
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([
        { id: 'A1-001', set_id: 'A1' },
      ]);

      const events = await collect(
        service.run({ seriesId: 'tcgp', cards: true, setIds: ['A1'] }),
      );

      expect(mockRepository.upsertSets).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'A1' }),
      ]);
      // and it happened before the cards were stored
      const setsOrder = mockRepository.upsertSets.mock.invocationCallOrder[0];
      const cardsOrder = mockRepository.upsertCards.mock.invocationCallOrder[0];
      expect(setsOrder).toBeLessThan(cardsOrder);

      const done = events[events.length - 1] as any;
      expect(done.counts.failed).toBe(0);
    });

    it('does not re-fetch the catalogue when the sets stage already ran', async () => {
      mockRepository.getSetsBySeriesId.mockResolvedValue([]);
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]);
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);

      await collect(
        service.run({ seriesId: 'tcgp', sets: true, cards: true }),
      );

      // Once for resolveTargetSets, once for the sets stage — not a third time.
      expect(
        mockFetchService.fetchAndMergeSetsForSeries.mock.calls.length,
      ).toBeLessThanOrEqual(2);
      expect(mockRepository.upsertSets).toHaveBeenCalledTimes(1);
    });

    it('fails only the sets whose row could not be created', async () => {
      mockRepository.getSetsBySeriesId.mockResolvedValue([
        { id: 'A1', name_en: 'Genetic Apex', card_count_total: 3 },
      ]);
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]);
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);
      mockRepository.upsertSets.mockRejectedValue(new Error('sets table down'));

      const events = await collect(service.run({ seriesId: 'tcgp', cards: true }));
      const setEvents = events.filter((e: any) => e.type === 'set') as any[];

      // A2 is remote-only and could not be created; A1 is already stored.
      expect(
        setEvents.find((e) => e.setId === 'A2' && e.state === 'error')?.message,
      ).toContain('sets table down');
      expect(setEvents.find((e) => e.setId === 'A1' && e.state === 'done')).toBeDefined();
    });

    it('creates the series row before the first set is written', async () => {
      // Nothing imported yet: sets cannot be inserted until the series exists.
      mockRepository.checkIfSeriesExists.mockResolvedValue(false);
      mockFetchService.fetchAndMergeSeries.mockResolvedValue([
        { id: 'tcgp', name_en: 'TCG Pocket', name_es: 'TCG Pocket', logo: null },
      ]);

      await collect(service.run({ seriesId: 'tcgp', sets: true }));

      expect(mockRepository.insertSeries).toHaveBeenCalled();
      expect(
        mockRepository.insertSeries.mock.invocationCallOrder[0],
      ).toBeLessThan(mockRepository.upsertSets.mock.invocationCallOrder[0]);
    });

    it('leaves the series alone when it is already stored', async () => {
      await collect(service.run({ seriesId: 'tcgp', sets: true }));

      expect(mockFetchService.fetchAndMergeSeries).not.toHaveBeenCalled();
      expect(mockRepository.insertSeries).not.toHaveBeenCalled();
    });

    it('trims a driver error down to a readable line', async () => {
      // A Drizzle failure carries the whole statement plus every bound param.
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]);
      mockFetchService.fetchAndMergeCardsForSet.mockRejectedValue(
        new Error(
          `Failed query: insert into \`tools_tcg_cards\` values ${'(?, default, default), '.repeat(200)}\nparams: ${'P-A-001,Trainer,'.repeat(500)}`,
        ),
      );

      const events = await collect(service.run({ seriesId: 'tcgp', cards: true }));
      const done = events[events.length - 1] as any;

      expect(done.failures[0].message.length).toBeLessThanOrEqual(240);
      expect(done.failures[0].message).toContain('Failed query');
      expect(done.failures[0].message).not.toContain('params:');
    });

    it('leaves a card alone once it has artwork in either locale', async () => {
      // Re-requesting the other locale would hit the same upstream 404 on every
      // run, for every promo, forever.
      mockRepository.getCardImageStateForSet.mockResolvedValue([
        { id: 'A2-001', imageLocalEn: '/en.webp', imageLocalEs: null },
      ]);

      await collect(
        service.run({ seriesId: 'tcgp', images: true, setIds: ['A2'] }),
      );

      expect(mockImageService.downloadCardImage).not.toHaveBeenCalled();
      expect(mockFetchService.fetchCardImageUrlsForSet).not.toHaveBeenCalled();
    });

    it('fetches both locales for a card that has no artwork yet', async () => {
      mockRepository.getCardImageStateForSet.mockResolvedValue([
        { id: 'A2-001', imageLocalEn: null, imageLocalEs: null },
      ]);
      mockFetchService.fetchCardImageUrlsForSet.mockResolvedValue(
        new Map([['A2-001', { en: 'https://x/en', es: 'https://x/es' }]]),
      );
      // EN is absent upstream (404 -> null), ES downloads fine.
      mockImageService.downloadCardImage.mockImplementation(
        async (_data: any, _id: string, _set: string, locale: string) =>
          locale === 'es' ? '/es.webp' : null,
      );

      const events = await collect(
        service.run({ seriesId: 'tcgp', images: true, setIds: ['A2'] }),
      );

      expect(mockImageService.downloadCardImage).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateCardImages).toHaveBeenCalledWith('A2-001', {
        imageLocalEs: '/es.webp',
      });

      // One locale missing upstream is not a failure - the card got artwork.
      const done = events[events.length - 1] as any;
      expect(done.counts.failed).toBe(0);
      expect(done.counts.downloaded).toBe(1);
    });

    it('counts a card as failed only when neither locale could be stored', async () => {
      mockRepository.getCardImageStateForSet.mockResolvedValue([
        { id: 'A2-001', imageLocalEn: null, imageLocalEs: null },
      ]);
      mockFetchService.fetchCardImageUrlsForSet.mockResolvedValue(
        new Map([['A2-001', { en: 'https://x/en', es: 'https://x/es' }]]),
      );
      mockImageService.downloadCardImage.mockResolvedValue(null);

      const events = await collect(
        service.run({ seriesId: 'tcgp', images: true, setIds: ['A2'] }),
      );

      const done = events[events.length - 1] as any;
      expect(done.counts.failed).toBe(1);
      expect(mockRepository.updateCardImages).not.toHaveBeenCalled();
    });

    it('reports a card with no artwork published upstream as skipped, not failed', async () => {
      // tcgdex ships no `image` field at all for P-A 074+, in either locale and
      // on either endpoint. Nothing to download is a result, not an error.
      mockRepository.getCardImageStateForSet.mockResolvedValue([
        { id: 'A2-001', imageLocalEn: null, imageLocalEs: null },
        { id: 'A2-002', imageLocalEn: null, imageLocalEs: null },
      ]);
      mockFetchService.fetchCardImageUrlsForSet.mockResolvedValue(
        new Map([
          ['A2-001', { en: null, es: null }],
          // A2-002 is not in the brief at all - same absence.
        ]),
      );

      const events = await collect(
        service.run({ seriesId: 'tcgp', images: true, setIds: ['A2'] }),
      );

      expect(mockImageService.downloadCardImage).not.toHaveBeenCalled();

      const setEvent = events.find(
        (e: any) => e.type === 'set' && e.state === 'done',
      ) as any;
      expect(setEvent.unavailable).toBe(2);

      const done = events[events.length - 1] as any;
      expect(done.counts.failed).toBe(0);
      expect(done.counts.skipped).toBe(2);
      expect(done.failures).toEqual([]);
    });

    it('stops downloading artwork mid-set when the client disconnects', async () => {
      mockRepository.getCardImageStateForSet.mockResolvedValue([
        { id: 'A2-001', imageLocalEn: null, imageLocalEs: null },
        { id: 'A2-002', imageLocalEn: null, imageLocalEs: null },
        { id: 'A2-003', imageLocalEn: null, imageLocalEs: null },
      ]);
      mockFetchService.fetchCardImageUrlsForSet.mockResolvedValue(
        new Map([
          ['A2-001', { en: 'https://x/1', es: null }],
          ['A2-002', { en: 'https://x/2', es: null }],
          ['A2-003', { en: 'https://x/3', es: null }],
        ]),
      );
      let cancelled = false;
      mockImageService.downloadCardImage.mockImplementation(async () => {
        cancelled = true;
        return '/en.webp';
      });

      await collect(
        service.run(
          { seriesId: 'tcgp', images: true, setIds: ['A2'] },
          () => cancelled,
        ),
      );

      expect(mockImageService.downloadCardImage).toHaveBeenCalledTimes(1);
    });

    it('stops between sets once the client has disconnected', async () => {
      mockRepository.getSyncStatsBySeries.mockResolvedValue([]);
      mockFetchService.fetchAndMergeCardsForSet.mockResolvedValue([]);

      // Disconnect lands while the first set is being fetched.
      let cancelled = false;
      mockFetchService.fetchAndMergeCardsForSet.mockImplementation(async () => {
        cancelled = true;
        return [];
      });

      const events = await collect(
        service.run({ seriesId: 'tcgp', cards: true }, () => cancelled),
      );

      const done = events[events.length - 1] as any;
      expect(done.type).toBe('done');
      expect(done.cancelled).toBe(true);
      // Two sets were in scope; the second one never starts.
      expect(mockFetchService.fetchAndMergeCardsForSet).toHaveBeenCalledTimes(1);
    });
  });
});
