import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DesktopDeviceService } from './desktop-device.service';
import { DesktopDeviceRepository } from './desktop-device.repository';
import { PacksAuthService } from './packs-auth.service';
import { PacksRepository } from './packs.repository';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { AUDIT } from './types/packs.types';

// The device-authorization flow is how a launcher session comes into existence.
// Every test here is about one of the three things that must not go wrong:
// a code cannot be minted twice, an approval cannot be spent twice, and an
// unverified account cannot approve at all.

const UUID = '069a79f4-44e9-4726-a5be-fca90e38aaf5';
const DEVICE = 'd'.repeat(64);

const dupErr = () =>
  Object.assign(new Error('duplicate'), {
    code: 'ER_DUP_ENTRY',
    errno: 1062,
  });

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  deviceCode: DEVICE,
  userCode: 'BCDF-GHJK',
  clientLabel: 'Boffmedia App 1.0 (win)',
  status: 'pending',
  userId: null,
  consumedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
  ...over,
});

const user = (over: Record<string, unknown> = {}) => ({
  id: 7,
  username: 'TrainerAsh',
  uuid: UUID,
  emailVerified: true,
  ...over,
});

describe('DesktopDeviceService', () => {
  let service: DesktopDeviceService;
  let repo: jest.Mocked<DesktopDeviceRepository>;
  let auth: jest.Mocked<PacksAuthService>;
  let users: jest.Mocked<BoffMediaUsersFacadeService>;
  let packsRepo: jest.Mocked<PacksRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByDeviceCode: jest.fn(),
      findByUserCode: jest.fn(),
      decide: jest.fn().mockResolvedValue(true),
      consume: jest.fn().mockResolvedValue(true),
      sweepExpired: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DesktopDeviceRepository>;

    auth = {
      signSession: jest.fn().mockReturnValue('signed.jwt.token'),
    } as unknown as jest.Mocked<PacksAuthService>;

    users = {
      getUserById: jest.fn().mockResolvedValue(user()),
    } as unknown as jest.Mocked<BoffMediaUsersFacadeService>;

    packsRepo = {
      audit: jest.fn().mockResolvedValue(undefined),
      getDesktopTokenVersion: jest.fn().mockResolvedValue(4),
    } as unknown as jest.Mocked<PacksRepository>;

    service = new DesktopDeviceService(repo, auth, users, packsRepo);
  });

  describe('start', () => {
    it('sweeps expired rows and returns a prefilled verification uri', async () => {
      const result = await service.start('Boffmedia App', 'https://x/link');

      expect(repo.sweepExpired).toHaveBeenCalled();
      expect(result.userCode).toMatch(
        /^[2-9BCDFGHJKLMNPQRSTVWXZ]{4}-[2-9BCDFGHJKLMNPQRSTVWXZ]{4}$/,
      );
      expect(result.deviceCode).toHaveLength(64);
      expect(result.verificationUri).toBe(
        `https://x/link?code=${encodeURIComponent(result.userCode)}`,
      );
      expect(result.expiresIn).toBe(600);
      expect(result.intervalSeconds).toBe(3);
    });

    it('truncates an overlong client label to 128 chars', async () => {
      await service.start('L'.repeat(500), 'https://x/link');
      expect(repo.create.mock.calls[0][0].clientLabel).toHaveLength(128);
    });

    it('regenerates the user code on a duplicate-key collision', async () => {
      repo.create
        .mockRejectedValueOnce(dupErr())
        .mockRejectedValueOnce(dupErr())
        .mockResolvedValueOnce(undefined);

      const result = await service.start(null, 'https://x/link');

      expect(repo.create).toHaveBeenCalledTimes(3);
      const codes = repo.create.mock.calls.map((c) => c[0].userCode);
      // A retry that reused the colliding code would loop forever on the same row.
      expect(new Set(codes).size).toBe(3);
      expect(result.userCode).toBe(codes[2]);
      // The device code is generated once and survives the retries.
      expect(
        new Set(repo.create.mock.calls.map((c) => c[0].deviceCode)).size,
      ).toBe(1);
    });

    it('gives up after a bounded number of collisions instead of looping', async () => {
      repo.create.mockRejectedValue(dupErr());
      await expect(service.start(null, 'https://x/link')).rejects.toThrow(
        'duplicate',
      );
      expect(repo.create).toHaveBeenCalledTimes(5);
    });

    it('does not retry a non-duplicate insert failure', async () => {
      repo.create.mockRejectedValue(new Error('connection lost'));
      await expect(service.start(null, 'https://x/link')).rejects.toThrow(
        'connection lost',
      );
      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('poll', () => {
    it('reports pending while nobody has decided', async () => {
      repo.findByDeviceCode.mockResolvedValue(row() as never);
      await expect(service.poll(DEVICE)).resolves.toEqual({
        status: 'pending',
      });
      expect(repo.consume).not.toHaveBeenCalled();
    });

    it('reports pending for an "approved" row that carries no userId', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: null }) as never,
      );
      await expect(service.poll(DEVICE)).resolves.toEqual({
        status: 'pending',
      });
      expect(auth.signSession).not.toHaveBeenCalled();
    });

    it('reports denied', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'denied' }) as never,
      );
      await expect(service.poll(DEVICE)).resolves.toEqual({ status: 'denied' });
    });

    it('answers expired for an unknown/swept device code rather than throwing', async () => {
      repo.findByDeviceCode.mockResolvedValue(undefined);
      await expect(service.poll('nope')).resolves.toEqual({
        status: 'expired',
      });
    });

    it('answers expired for a row past its TTL even when it was approved', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({
          status: 'approved',
          userId: 7,
          expiresAt: new Date(Date.now() - 1),
        }) as never,
      );
      await expect(service.poll(DEVICE)).resolves.toEqual({
        status: 'expired',
      });
      expect(repo.consume).not.toHaveBeenCalled();
      expect(auth.signSession).not.toHaveBeenCalled();
    });

    it('consumes BEFORE minting and returns the session', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7 }) as never,
      );
      const order: string[] = [];
      repo.consume.mockImplementation(async () => {
        order.push('consume');
        return true;
      });
      auth.signSession.mockImplementation(() => {
        order.push('sign');
        return 'signed.jwt.token';
      });

      const result = await service.poll(DEVICE);

      expect(order).toEqual(['consume', 'sign']);
      expect(repo.consume).toHaveBeenCalledWith(DEVICE);
      expect(auth.signSession).toHaveBeenCalledWith(
        { userId: 7, username: 'TrainerAsh', mcUuid: UUID },
        // The account's live revocation counter is embedded at mint time.
        4,
      );
      expect(result).toEqual({
        status: 'approved',
        token: 'signed.jwt.token',
        user: { id: 7, username: 'TrainerAsh', mcUuid: UUID },
      });
    });

    it('writes the durable desktop.auth audit row', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7 }) as never,
      );
      await service.poll(DEVICE);
      expect(packsRepo.audit).toHaveBeenCalledWith(
        AUDIT.DESKTOP_AUTH,
        null,
        UUID,
        { userId: 7, clientLabel: 'Boffmedia App 1.0 (win)' },
        7,
      );
    });

    it('carries a null mcUuid for an account with no Minecraft linked', async () => {
      users.getUserById.mockResolvedValue(user({ uuid: null }) as never);
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7 }) as never,
      );
      const result = await service.poll(DEVICE);
      expect(result).toMatchObject({ user: { mcUuid: null } });
      expect(auth.signSession).toHaveBeenCalledWith(
        expect.objectContaining({ mcUuid: null }),
        expect.any(Number),
      );
    });

    it('embeds 0 when the account has no revocation counter yet', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7 }) as never,
      );
      (packsRepo.getDesktopTokenVersion as jest.Mock).mockResolvedValue(null);
      await service.poll(DEVICE);
      expect(auth.signSession).toHaveBeenCalledWith(expect.any(Object), 0);
    });

    it('a replayed poll after the consume cannot mint a second session', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7, consumedAt: new Date() }) as never,
      );
      repo.consume.mockResolvedValue(false);

      await expect(service.poll(DEVICE)).resolves.toEqual({
        status: 'expired',
      });
      expect(auth.signSession).not.toHaveBeenCalled();
      expect(packsRepo.audit).not.toHaveBeenCalled();
    });

    it('throws when the approving account has vanished', async () => {
      repo.findByDeviceCode.mockResolvedValue(
        row({ status: 'approved', userId: 7 }) as never,
      );
      users.getUserById.mockResolvedValue(null as never);
      await expect(service.poll(DEVICE)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('describe', () => {
    it('normalizes the pasted code before looking it up', async () => {
      repo.findByUserCode.mockResolvedValue(row() as never);
      await service.describe('bcdfghjk');
      expect(repo.findByUserCode).toHaveBeenCalledWith('BCDF-GHJK');
    });

    it('404s an unknown code', async () => {
      repo.findByUserCode.mockResolvedValue(undefined);
      await expect(service.describe('BCDF-GHJK')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400s a code past its TTL', async () => {
      repo.findByUserCode.mockResolvedValue(
        row({ expiresAt: new Date(Date.now() - 1) }) as never,
      );
      await expect(service.describe('BCDF-GHJK')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('approve', () => {
    it('requires a verified email', async () => {
      users.getUserById.mockResolvedValue(
        user({ emailVerified: false }) as never,
      );
      await expect(service.approve('BCDF-GHJK', 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.decide).not.toHaveBeenCalled();
    });

    it('404s when the approving account does not exist', async () => {
      users.getUserById.mockResolvedValue(null as never);
      await expect(service.approve('BCDF-GHJK', 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.decide).not.toHaveBeenCalled();
    });

    it('records the decision against the normalized code and the actor', async () => {
      await service.approve(' bcdf ghjk ', 7);
      expect(repo.decide).toHaveBeenCalledWith('BCDF-GHJK', 'approved', 7);
    });

    it.each([
      ['BCDF-GHJK'],
      ['bcdfghjk'],
      ['bcdf-ghjk'],
      ['BCDFGHJK'],
      ['bCdF gHjK'],
    ])('resolves the pasted form %s to the canonical code', async (pasted) => {
      await service.approve(pasted, 7);
      expect(repo.decide).toHaveBeenCalledWith('BCDF-GHJK', 'approved', 7);
    });

    it('400s when the conditional UPDATE loses (expired or already decided)', async () => {
      // repo.decide is the arbiter: its WHERE demands pending AND expiresAt > NOW().
      repo.decide.mockResolvedValue(false);
      await expect(service.approve('BCDF-GHJK', 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('deny', () => {
    it('records the denying actor in the audit log', async () => {
      await service.deny('bcdfghjk', 9);
      expect(repo.decide).toHaveBeenCalledWith('BCDF-GHJK', 'denied', 9);
      expect(packsRepo.audit).toHaveBeenCalledWith(
        AUDIT.DESKTOP_DENIED,
        null,
        null,
        { userId: 9, userCode: 'BCDF-GHJK' },
        9,
      );
    });

    it('400s and audits nothing when the code is no longer deniable', async () => {
      repo.decide.mockResolvedValue(false);
      await expect(service.deny('BCDF-GHJK', 9)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(packsRepo.audit).not.toHaveBeenCalled();
    });
  });
});
