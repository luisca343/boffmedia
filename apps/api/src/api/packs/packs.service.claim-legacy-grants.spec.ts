import { PacksService } from './packs.service';
import { PacksRepository } from './packs.repository';
import { RandomizerPackLinkRepository } from '@api/_repositories/randomizer/pack-link.repository';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';

// Legacy pre-grants: a pack an admin granted to a bare Minecraft UUID before
// that player had an account. Linking the account is the moment those become
// real. The service surfaces failures; the LINK path is what swallows them.

const UUID = '069A79F4-44E9-4726-A5BE-FCA90E38AAF5';

describe('PacksService.claimLegacyGrants', () => {
  let service: PacksService;
  let repo: jest.Mocked<PacksRepository>;

  beforeEach(() => {
    repo = {
      claimLegacyGrants: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<PacksRepository>;
    service = new PacksService(
      repo,
      { findByPackId: jest.fn() } as unknown as RandomizerPackLinkRepository,
    );
  });

  it('lowercases the uuid before matching pack_acl', async () => {
    await expect(service.claimLegacyGrants(7, UUID)).resolves.toBe(2);
    expect(repo.claimLegacyGrants).toHaveBeenCalledWith(7, UUID.toLowerCase());
  });

  it('reports zero when there was nothing to claim', async () => {
    repo.claimLegacyGrants.mockResolvedValue(0);
    await expect(service.claimLegacyGrants(7, UUID)).resolves.toBe(0);
  });

  it('surfaces a repository failure rather than swallowing it', async () => {
    // Best-effort is the CALL SITE's policy, not this service's: a caller that
    // does care (an admin backfill) must be able to see the failure.
    repo.claimLegacyGrants.mockRejectedValue(new Error('deadlock'));
    await expect(service.claimLegacyGrants(7, UUID)).rejects.toThrow('deadlock');
  });
});

describe('BoffMediaUsersFacadeService — claiming is best-effort on link', () => {
  const make = (packsService: { claimLegacyGrants: jest.Mock }) => {
    const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    const usersManagement = {
      getUserByUuid: jest.fn().mockResolvedValue(null),
      setMinecraftUuid: jest.fn().mockResolvedValue({ id: 7, username: 'TrainerAsh' }),
    };
    const smartRotom = { initializeUserAndAccounts: jest.fn().mockResolvedValue({}) };
    const moduleRef = { get: jest.fn().mockReturnValue(packsService) };

    const facade = new BoffMediaUsersFacadeService(
      logger as never,
      usersManagement as never,
      smartRotom as never,
      {} as never,
      moduleRef as never,
    );
    return { facade, logger, usersManagement };
  };

  it('claims the pre-grants once the link is written', async () => {
    const packsService = { claimLegacyGrants: jest.fn().mockResolvedValue(3) };
    const { facade, usersManagement } = make(packsService);

    await facade.linkProvenMinecraftAccount(7, {
      uuid: 'abc-uuid',
      username: 'TrainerAsh',
    });

    expect(usersManagement.setMinecraftUuid).toHaveBeenCalledWith(7, 'abc-uuid');
    expect(packsService.claimLegacyGrants).toHaveBeenCalledWith(7, 'abc-uuid');
  });

  it('does not fail the link when the claim throws', async () => {
    const packsService = {
      claimLegacyGrants: jest.fn().mockRejectedValue(new Error('deadlock')),
    };
    const { facade, logger } = make(packsService);

    await expect(
      facade.linkProvenMinecraftAccount(7, { uuid: 'abc-uuid', username: 'TrainerAsh' }),
    ).resolves.toMatchObject({ id: 7 });
    expect(logger.error).toHaveBeenCalled();
  });
});
