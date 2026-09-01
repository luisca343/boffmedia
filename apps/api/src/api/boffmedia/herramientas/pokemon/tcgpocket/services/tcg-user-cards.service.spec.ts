import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { BoffMediaUsersManagementService } from '@api/boffmedia/users/services/users-management.service';

import { TcgService } from './tcg.service';
import { TcgErrorService } from './tcg-error.service';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';

/**
 * `PUT users/:userId/cards/:cardId` is an UPSERT, and these are the cases that
 * make it one.
 *
 * This is not decoration: the desktop app queues collection edits while the
 * player is offline and replays them when the API comes back, at least once
 * (see `apps/desktop/src-tauri/src/tool_db.rs`). That is only safe while
 * setting a quantity is idempotent and does not depend on what the row looked
 * like when the player clicked — which is exactly what the old 404-when-absent
 * behaviour broke.
 */
describe('TcgService — user card upsert', () => {
  let service: TcgService;

  const repo = {
    getUserCard: jest.fn(),
    addUserCard: jest.fn(),
    updateUserCardQuantity: jest.fn(),
    removeUserCard: jest.fn(),
    addUserCardHistory: jest.fn(),
    checkIfCardExists: jest.fn(),
    getUserCards: jest.fn(),
  };

  const usersService = { getUserByUsername: jest.fn() };

  const errorService = {
    handleDatabaseError: jest.fn((error: unknown) => {
      throw error;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.addUserCard.mockResolvedValue(undefined);
    repo.updateUserCardQuantity.mockResolvedValue(undefined);
    repo.removeUserCard.mockResolvedValue(undefined);
    repo.addUserCardHistory.mockResolvedValue(undefined);
    repo.checkIfCardExists.mockResolvedValue(true);
    repo.getUserCards.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgService,
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: TCGPOCKET_REPOSITORY_TOKEN, useValue: repo },
        { provide: TcgErrorService, useValue: errorService },
        { provide: TcgFetchService, useValue: {} },
        { provide: TcgImageService, useValue: {} },
        {
          provide: BoffMediaUsersManagementService,
          useValue: { getUserByUsername: usersService.getUserByUsername },
        },
      ],
    }).compile();

    service = module.get(TcgService);
  });

  // -- getUserCards: id or username -----------------------------------------

  describe('getUserCards()', () => {
    // The route param is named `userName`, but the ported tool - and every
    // sibling route - addresses a player by numeric id. Passing an id used to
    // hit `(await getUserByUsername(id))!.id`, and the `!` on an undefined
    // lookup threw a TypeError the app saw as a 500 "Database operation failed".

    it('takes a numeric id straight through, with no username lookup', async () => {
      await service.getUserCards('1');

      expect(usersService.getUserByUsername).not.toHaveBeenCalled();
      expect(repo.getUserCards).toHaveBeenCalledWith(1);
    });

    it('still resolves a username', async () => {
      usersService.getUserByUsername.mockResolvedValue({ id: 42 });

      await service.getUserCards('Luisca');

      expect(usersService.getUserByUsername).toHaveBeenCalledWith('Luisca');
      expect(repo.getUserCards).toHaveBeenCalledWith(42);
    });

    it('answers 404 for a username nobody has, instead of dereferencing undefined', async () => {
      usersService.getUserByUsername.mockResolvedValue(null);

      await expect(service.getUserCards('nobody')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.getUserCards).not.toHaveBeenCalled();
    });

    it('rejects an empty identifier', async () => {
      await expect(service.getUserCards('   ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  it('creates the entry when the player does not own the card yet', async () => {
    repo.getUserCard.mockResolvedValue(null);

    await service.updateUserCardQuantity(7, 'tcgp-A1-001', { quantity: 3 });

    expect(repo.addUserCard).toHaveBeenCalledWith(7, 'tcgp-A1-001', 3);
    expect(repo.updateUserCardQuantity).not.toHaveBeenCalled();
    // The whole quantity is the change, since there was nothing before it.
    expect(repo.addUserCardHistory).toHaveBeenCalledWith(7, 'tcgp-A1-001', 3);
  });

  it('refuses to create an entry for a card that does not exist', async () => {
    repo.getUserCard.mockResolvedValue(null);
    repo.checkIfCardExists.mockResolvedValue(false);

    await expect(
      service.updateUserCardQuantity(7, 'tcgp-NOPE-999', { quantity: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.addUserCard).not.toHaveBeenCalled();
  });

  it('updates the quantity when the player already owns the card', async () => {
    repo.getUserCard.mockResolvedValue({ quantity: 2 });

    await service.updateUserCardQuantity(7, 'tcgp-A1-001', { quantity: 5 });

    expect(repo.updateUserCardQuantity).toHaveBeenCalledWith(
      7,
      'tcgp-A1-001',
      5,
    );
    expect(repo.addUserCard).not.toHaveBeenCalled();
    // History records the DELTA, not the new total.
    expect(repo.addUserCardHistory).toHaveBeenCalledWith(7, 'tcgp-A1-001', 3);
  });

  it('removes the entry at quantity 0', async () => {
    repo.getUserCard.mockResolvedValue({ quantity: 2 });

    await service.updateUserCardQuantity(7, 'tcgp-A1-001', { quantity: 0 });

    expect(repo.removeUserCard).toHaveBeenCalledWith(7, 'tcgp-A1-001');
    expect(repo.addUserCardHistory).toHaveBeenCalledWith(7, 'tcgp-A1-001', -2);
  });

  it('treats a removal of something already absent as done, not as an error', async () => {
    repo.getUserCard.mockResolvedValue(null);

    await expect(
      service.updateUserCardQuantity(7, 'tcgp-A1-001', { quantity: 0 }),
    ).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(repo.removeUserCard).not.toHaveBeenCalled();
    // Nothing changed, so nothing belongs in the history.
    expect(repo.addUserCardHistory).not.toHaveBeenCalled();
  });

  it('is idempotent: replaying the same quantity is a no-op', async () => {
    repo.getUserCard.mockResolvedValue({ quantity: 4 });

    await service.updateUserCardQuantity(7, 'tcgp-A1-001', { quantity: 4 });

    // The write still happens (it is a PUT of the same state), but the history
    // must not gain an entry for a change that did not occur — otherwise a
    // replayed op would show up in the player's activity feed as a second edit.
    expect(repo.addUserCardHistory).not.toHaveBeenCalled();
  });
});
