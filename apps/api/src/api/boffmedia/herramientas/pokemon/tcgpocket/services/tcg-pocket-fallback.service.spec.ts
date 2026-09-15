import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from 'nestjs-pino';
import { of } from 'rxjs';
import { TcgPocketFallbackService } from './tcg-pocket-fallback.service';
import { TcgConfigService } from './tcg-config.service';
import { TcgImageService } from './tcg-image.service';

const mockHttpService = { get: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn() };
const mockConfigService = {
  getPackArtworkCatalogUrl: jest.fn(
    () => 'https://raw.example/expansions.json',
  ),
  getPackArtworkImageUrl: jest.fn(
    (id: string) => `https://raw.example/packs/${id}.webp`,
  ),
};
const mockImageService = { downloadCardImage: jest.fn() };

describe('TcgPocketFallbackService', () => {
  let service: TcgPocketFallbackService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockConfigService.getPackArtworkCatalogUrl.mockReturnValue(
      'https://raw.example/expansions.json',
    );
    mockConfigService.getPackArtworkImageUrl.mockImplementation(
      (id: string) => `https://raw.example/packs/${id}.webp`,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgPocketFallbackService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: Logger, useValue: mockLogger },
        { provide: TcgConfigService, useValue: mockConfigService },
        { provide: TcgImageService, useValue: mockImageService },
      ],
    }).compile();

    service = module.get<TcgPocketFallbackService>(TcgPocketFallbackService);
  });

  it('discovers Pocket expansions from the fallback catalogue', async () => {
    mockHttpService.get.mockReturnValue(
      of({
        data: [
          {
            id: 'b4a',
            name: "Team Rocket's Ambition",
            total_cards: 110,
          },
        ],
      }),
    );

    await expect(service.getSetsForSeries('tcgp')).resolves.toEqual([
      {
        id: 'B4a',
        name_en: "Team Rocket's Ambition",
        name_es: "Team Rocket's Ambition",
        total_cards: 110,
      },
    ]);
    expect(mockHttpService.get).toHaveBeenCalledWith(
      'https://raw.example/expansions.json',
    );
  });

  it('normalizes fallback cards and keeps the PocketDecks image URL', async () => {
    mockHttpService.get
      .mockReturnValueOnce(
        of({
          data: [
            {
              id: 'b4a',
              cards_url: 'https://raw.example/b4a.json',
            },
          ],
        }),
      )
      .mockReturnValueOnce(
        of({
          data: [
            {
              id: 'b4a-073',
              set_code: 'b4a',
              name: 'Example Card',
              image:
                'https://raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/main/images/webp/cards/b4a-073.webp',
            },
          ],
        }),
      );

    const cards = await service.fetchCardsForSet('B4a', {
      withImages: false,
    });

    expect(cards[0]).toEqual(
      expect.objectContaining({
        id: 'tcgp-B4a-073',
        set_id: 'B4a',
        local_id: '073',
        image:
          'https://raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/main/images/webp/cards/b4a-073.webp',
      }),
    );
  });

  it('tries the localized card image before PocketDecks', async () => {
    mockImageService.downloadCardImage
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('/cards/B4a/tcgp-B4a-073_es.webp');

    const fallbackImage =
      'https://raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/main/images/webp/cards/b4a-073.webp';
    const result = await service.downloadCardImage(
      fallbackImage,
      'tcgp-B4a-073',
      'B4a',
      'es',
    );

    expect(result).toBe('/cards/B4a/tcgp-B4a-073_es.webp');
    expect(mockImageService.downloadCardImage).toHaveBeenNthCalledWith(
      1,
      {
        image: 'https://game.pokemontcgpocket.app/es/tcgp/B4a/073/high.webp',
      },
      'tcgp-B4a-073',
      'B4a',
      'es',
    );
    expect(mockImageService.downloadCardImage).toHaveBeenNthCalledWith(
      2,
      { image: fallbackImage },
      'tcgp-B4a-073',
      'B4a',
      'es',
    );
  });
});
