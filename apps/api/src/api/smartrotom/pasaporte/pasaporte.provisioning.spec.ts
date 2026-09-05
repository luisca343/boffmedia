import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PasaporteService } from './pasaporte.service';
import { PasaporteRepository } from './pasaporte.repository';

/**
 * Owner decision 2026-09-05: a passport is READABLE by anyone and PROVISIONED
 * only by its owner.
 *
 * This route is the only place a passport row is ever written, and two fields
 * are frozen at that moment -- the region, taken from whatever world the player
 * is in, and memberSince. Provisioning on an anonymous read therefore let a
 * stranger decide a player's region by being the first to look.
 *
 * The assertion that matters in every case below is on `createProfile`: whether
 * the write HAPPENED, not merely what was returned. A version that 404s after
 * inserting the row would satisfy a status-code-only test and still have taken
 * the decision away from the owner.
 */

const OWNER = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const STRANGER = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const existingProfile = {
  uuid: OWNER,
  trainerId: '12345',
  region: 'Teras',
  memberSince: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PasaporteService.getProfile — provisioning is owner-only', () => {
  let service: PasaporteService;
  let repo: jest.Mocked<PasaporteRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasaporteService,
        {
          provide: PasaporteRepository,
          useValue: {
            findUser: jest.fn(),
            findProfile: jest.fn(),
            createProfile: jest.fn(),
            achievementTotals: jest.fn(),
            firstActivityAt: jest.fn(),
            trainerIdOwner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PasaporteService);
    repo = moduleRef.get(PasaporteRepository);

    repo.findUser.mockResolvedValue({ uuid: OWNER, world: 'Teras' } as never);
    repo.achievementTotals.mockResolvedValue({ completed: 0, total: 0 } as never);
    repo.firstActivityAt.mockResolvedValue(null as never);
    repo.trainerIdOwner.mockResolvedValue(null as never);
  });

  it('provisions when the OWNER reads their own passport for the first time', async () => {
    repo.findProfile
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(existingProfile as never);

    await service.getProfile(OWNER, OWNER);

    expect(repo.createProfile).toHaveBeenCalledTimes(1);
    expect(repo.createProfile.mock.calls[0][0]).toMatchObject({ uuid: OWNER });
  });

  it('does NOT provision when a stranger reads a passport that does not exist', async () => {
    repo.findProfile.mockResolvedValue(null as never);

    await expect(service.getProfile(OWNER, STRANGER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.createProfile).not.toHaveBeenCalled();
  });

  it('does NOT provision for an ANONYMOUS reader', async () => {
    repo.findProfile.mockResolvedValue(null as never);

    // undefined caller is what @CurrentMcUuidOptional() yields with no session.
    await expect(service.getProfile(OWNER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.createProfile).not.toHaveBeenCalled();
  });

  it('still lets a stranger READ a passport that already exists', async () => {
    repo.findProfile.mockResolvedValue(existingProfile as never);

    const view = await service.getProfile(OWNER, STRANGER);

    expect(view.uuid).toBe(OWNER);
    expect(repo.createProfile).not.toHaveBeenCalled();
  });

  it('still lets an ANONYMOUS reader read a passport that already exists', async () => {
    repo.findProfile.mockResolvedValue(existingProfile as never);

    const view = await service.getProfile(OWNER);

    expect(view.uuid).toBe(OWNER);
    expect(repo.createProfile).not.toHaveBeenCalled();
  });

  it('404s for a uuid that is not a real player, whoever asks', async () => {
    repo.findUser.mockResolvedValue(null as never);

    await expect(service.getProfile(OWNER, OWNER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.createProfile).not.toHaveBeenCalled();
  });
});
