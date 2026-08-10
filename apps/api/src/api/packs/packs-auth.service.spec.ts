import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PacksAuthService } from './packs-auth.service';
import { PacksRepository } from './packs.repository';

// A real JwtService over a real secret: the point of these tests is what the
// token CONTAINS and what verify refuses, and a mocked signer proves neither.

const SECRET = 'test-secret-that-is-long-enough-32chars';
const UUID = '069a79f4-44e9-4726-a5be-fca90e38aaf5';

describe('PacksAuthService', () => {
  let jwt: JwtService;
  let repo: jest.Mocked<PacksRepository>;
  let service: PacksAuthService;

  beforeEach(() => {
    jwt = new JwtService({ secret: SECRET });
    repo = {
      incrementLauncherTokenVersion: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PacksRepository>;
    service = new PacksAuthService(jwt, repo);
  });

  describe('signSession', () => {
    it('subjects the token on the Boffmedia account id and marks it launcher', () => {
      const token = service.signSession(
        { userId: 7, username: 'TrainerAsh', mcUuid: UUID },
        3,
      );
      const payload = jwt.verify<Record<string, unknown>>(token);

      expect(payload.sub).toBe(7);
      expect(payload.typ).toBe('launcher');
      expect(payload.username).toBe('TrainerAsh');
      expect(payload.mcUuid).toBe(UUID);
      expect(payload.ltv).toBe(3);
    });

    it('omits mcUuid entirely for an account with no Minecraft linked', () => {
      const token = service.signSession(
        { userId: 7, username: 'TrainerAsh', mcUuid: null },
        0,
      );
      expect(jwt.verify<Record<string, unknown>>(token)).not.toHaveProperty('mcUuid');
    });

    it('round-trips through verifySession', () => {
      const token = service.signSession(
        { userId: 7, username: 'TrainerAsh', mcUuid: UUID },
        2,
      );
      expect(service.verifySession(token)).toEqual({
        userId: 7,
        username: 'TrainerAsh',
        mcUuid: UUID,
        tokenVersion: 2,
      });
    });

    it('round-trips a null mcUuid as null, not undefined', () => {
      const token = service.signSession(
        { userId: 7, username: 'TrainerAsh', mcUuid: null },
        0,
      );
      expect(service.verifySession(token).mcUuid).toBeNull();
    });
  });

  describe('verifySession', () => {
    it('rejects a website/access token: no launcher `typ`', () => {
      // Exactly the shape a website session has — same secret, no typ claim.
      const website = jwt.sign({ sub: 7, username: 'TrainerAsh', roles: ['user'] });
      expect(() => service.verifySession(website)).toThrow(UnauthorizedException);
      try {
        service.verifySession(website);
      } catch (err: any) {
        expect(JSON.stringify(err.getResponse())).toContain('tipo incorrecto');
      }
    });

    it('rejects a token whose typ is something else entirely', () => {
      const other = jwt.sign({ sub: 7, username: 'x', typ: 'refresh' });
      expect(() => service.verifySession(other)).toThrow(UnauthorizedException);
    });

    it('rejects an OLD MC-UUID-subject session with needs_newer_launcher', () => {
      const legacy = jwt.sign({ sub: UUID, username: 'TrainerAsh', typ: 'launcher' });
      try {
        service.verifySession(legacy);
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.getResponse()).toMatchObject({ error: 'needs_newer_launcher' });
      }
    });

    it.each([[0], [-1], [1.5]])('rejects a non-positive-integer subject (%s)', (sub) => {
      const bad = jwt.sign({ sub, username: 'x', typ: 'launcher' });
      try {
        service.verifySession(bad);
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err.getResponse()).toMatchObject({ error: 'needs_newer_launcher' });
      }
    });

    it('rejects a token signed with a different secret', () => {
      const foreign = new JwtService({ secret: 'a-completely-different-secret-value' }).sign(
        { sub: 7, username: 'x', typ: 'launcher' },
      );
      expect(() => service.verifySession(foreign)).toThrow(UnauthorizedException);
    });

    it('rejects an expired launcher token', () => {
      const expired = jwt.sign(
        { sub: 7, username: 'x', typ: 'launcher' },
        { expiresIn: '-1s' },
      );
      expect(() => service.verifySession(expired)).toThrow(UnauthorizedException);
    });

    it('rejects garbage instead of leaking the jwt error', () => {
      expect(() => service.verifySession('not-a-jwt')).toThrow(UnauthorizedException);
    });

    it('treats a token minted before revocation existed as version 0', () => {
      const preRevocation = jwt.sign({ sub: 7, username: 'x', typ: 'launcher' });
      expect(service.verifySession(preRevocation).tokenVersion).toBe(0);
    });
  });

  it('revokeAllLauncherSessions bumps the account counter', async () => {
    await service.revokeAllLauncherSessions(7);
    expect(repo.incrementLauncherTokenVersion).toHaveBeenCalledWith(7);
  });
});
