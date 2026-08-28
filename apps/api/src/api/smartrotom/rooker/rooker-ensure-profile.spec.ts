import { Test, TestingModule } from '@nestjs/testing';

import { RookerService } from './rooker.service';
import { RookerRepository } from './rooker.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { PokemonDataManagementService } from '../pokemon/services/pokemon-data-management.service';
import { baseHandle, dedupeHandle, handleCandidates } from './handle';

/**
 * ensureProfile() is the only thing standing between a new player and the dead end a
 * missing Rooker profile puts them in, and its interesting paths are all failure paths:
 * a handle already taken, and two players racing for the same one. Those are what this
 * covers.
 */
describe('RookerService.ensureProfile()', () => {
  let service: RookerService;
  let repo: {
    findProfileByUuid: jest.Mock;
    findHandleOwner: jest.Mock;
    insertProfile: jest.Mock;
  };

  const UUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    repo = {
      findProfileByUuid: jest.fn().mockResolvedValue(null),
      findHandleOwner: jest.fn().mockResolvedValue(null),
      insertProfile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RookerService,
        { provide: RookerRepository, useValue: repo },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        { provide: PokemonDataManagementService, useValue: {} },
      ],
    }).compile();

    service = module.get(RookerService);
  });

  it('derives the handle from the username', async () => {
    await expect(service.ensureProfile(UUID, 'TrainerAsh')).resolves.toBe(
      'trainerash',
    );
    expect(repo.insertProfile).toHaveBeenCalledWith(
      UUID,
      'trainerash',
      'TrainerAsh',
    );
  });

  it('is idempotent — an existing profile is returned, never renamed', async () => {
    repo.findProfileByUuid.mockResolvedValue({ handle: 'the_original' });

    await expect(service.ensureProfile(UUID, 'Renamed')).resolves.toBe(
      'the_original',
    );
    expect(repo.insertProfile).not.toHaveBeenCalled();
  });

  it('suffixes when the derived handle is taken', async () => {
    repo.findHandleOwner.mockImplementation(async (h: string) =>
      h === 'ash_' ? 'somebody-else' : null,
    );

    await expect(service.ensureProfile(UUID, 'Ash!')).resolves.toBe('ash_2');
  });

  it('takes the next candidate when it loses a race on the unique index', async () => {
    // Both players cleared the pre-check, then the insert lost.
    repo.insertProfile
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))
      .mockResolvedValueOnce(undefined);

    await expect(service.ensureProfile(UUID, 'Ash!')).resolves.toBe('ash_2');
    expect(repo.insertProfile).toHaveBeenCalledTimes(2);
  });

  it('rethrows a failure that is not a collision', async () => {
    repo.insertProfile.mockRejectedValue(
      Object.assign(new Error('connection lost'), { code: 'ECONNRESET' }),
    );

    await expect(service.ensureProfile(UUID, 'Ash!')).rejects.toThrow(
      'connection lost',
    );
  });

  it('gives up rather than looping forever when everything is taken', async () => {
    repo.findHandleOwner.mockResolvedValue('somebody-else');

    await expect(service.ensureProfile(UUID, 'Ash!')).resolves.toBeNull();
    expect(repo.insertProfile).not.toHaveBeenCalled();
  });
});

describe('handle derivation', () => {
  it.each([
    ['TrainerAsh', 'trainerash'],
    ['Ash!', 'ash_'],
    ['A s h', 'a_s_h'],
    ['x', 'x__'], // padded up to the 3-char minimum
    ['ÉLITE', '_lite'], // non-ASCII is not [a-z0-9_]
  ])('baseHandle(%j) -> %j', (input, expected) => {
    expect(baseHandle(input)).toBe(expected);
  });

  it('keeps a handle inside 32 characters, suffix included', () => {
    const long = 'a'.repeat(40);
    const taken = new Set([baseHandle(long)]);

    const handle = dedupeHandle(baseHandle(long), taken);

    expect(handle).toHaveLength(32);
    expect(handle.endsWith('2')).toBe(true);
  });

  it('hands out candidates in the order the seed and the runtime both expect', () => {
    const it2 = handleCandidates('ash_');
    expect([it2.next().value, it2.next().value, it2.next().value]).toEqual([
      'ash_',
      'ash_2',
      'ash_3',
    ]);
  });

  it('matches the regex the service validates against', () => {
    for (const name of ['TrainerAsh', 'Ash!', 'x', 'ÉLITE', '¡¿?!']) {
      expect(baseHandle(name)).toMatch(/^[a-z0-9_]{3,32}$/);
    }
  });
});
