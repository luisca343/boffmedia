import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { BoffMediaUsersManagementService } from '@api/boffmedia/users/services/users-management.service';
import { TcgService } from './tcg.service';
import { TcgErrorService } from './tcg-error.service';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';

/**
 * The contract of `GET /tcg/users/:userName/cards`, pinned.
 *
 * T13 in the product audit reads \"gallery privacy is enforced only by the API
 * and has no test\". The first half does not hold: there is no privacy to
 * enforce. `tools_tcg_user_cards` has no public/private column, the read route
 * carries no guard (the controller is `@Public()` and only the WRITE routes
 * take `DesktopOrUserAuthGuard`), and the site exposes `galeria/[username]` as
 * a shareable page. A collection is public by construction.
 *
 * So this suite does NOT assert that private collections are refused — that
 * would be testing a feature nobody built. It pins what is actually true, so
 * that if an owner later decides collections should be private, the change
 * shows up here as a failing test rather than as silence. What it does protect
 * is the resolution behaviour, which has already broken once: an id used to be
 * fed to `getUserByUsername`, whose undefined result was non-null-asserted into
 * a TypeError and surfaced as a 500 \"Database operation failed\".
 */
describe('TcgService.getUserCards()', () => {
  let service: TcgService;

  const repo = { getUserCards: jest.fn() };
  const users = { getUserByUsername: jest.fn() };
  const errors = {
    handleDatabaseError: jest.fn((e: unknown) => {
      throw e;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgService,
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: TCGPOCKET_REPOSITORY_TOKEN, useValue: repo },
        { provide: TcgErrorService, useValue: errors },
        { provide: TcgFetchService, useValue: {} },
        { provide: TcgImageService, useValue: {} },
        { provide: BoffMediaUsersManagementService, useValue: users },
      ],
    }).compile();
    service = module.get(TcgService);
  });

  it('reads a collection by numeric id without a username lookup', async () => {
    repo.getUserCards.mockResolvedValue([{ card_id: 'sv1-1', quantity: 2 }]);

    const cards = await service.getUserCards('42');

    expect(repo.getUserCards).toHaveBeenCalledWith(42);
    // The regression that produced the 500: an id must never be sent to the
    // username lookup.
    expect(users.getUserByUsername).not.toHaveBeenCalled();
    expect(cards).toEqual([{ card_id: 'sv1-1', quantity: 2 }]);
  });

  it('resolves a username to an id before reading', async () => {
    users.getUserByUsername.mockResolvedValue({ id: 7 });
    repo.getUserCards.mockResolvedValue([]);

    await service.getUserCards('ash');

    expect(users.getUserByUsername).toHaveBeenCalledWith('ash');
    expect(repo.getUserCards).toHaveBeenCalledWith(7);
  });

  it('answers 404 for an unknown username rather than a database error', async () => {
    users.getUserByUsername.mockResolvedValue(null);

    await expect(service.getUserCards('nobody')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.getUserCards).not.toHaveBeenCalled();
  });

  it('rejects a blank identifier as a bad request', async () => {
    await expect(service.getUserCards('   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('serves any user to any caller: the collection is public by design', async () => {
    // No principal is passed in at all — the service takes only an identifier.
    // This test exists to make that explicit: if collections ever become
    // private, this is the test that has to change, and it says so.
    users.getUserByUsername.mockResolvedValue({ id: 9 });
    repo.getUserCards.mockResolvedValue([{ card_id: 'sv2-3', quantity: 1 }]);

    await expect(service.getUserCards('someone-else')).resolves.toHaveLength(1);
  });
});
