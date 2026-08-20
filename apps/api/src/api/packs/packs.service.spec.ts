import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PacksRepository } from './packs.repository';
import { RandomizerPackLinkRepository } from '@api/_repositories/randomizer/pack-link.repository';
import { PacksService } from './packs.service';

// These tests concentrate on the ONE thing worth being paranoid about: who can
// obtain a manifest. Everything else in this module is CRUD; this is the part
// where a mistake hands a private pack to the wrong person.

const UUID = '069a79f4-44e9-4726-a5be-fca90e38aaf5';
// Launcher requests carry a Minecraft UUID; the service speaks PackPrincipal so
// a Boffmedia id can be swapped in without touching it.
const WHO = { mcUuid: UUID };
// A launcher session: the account is the principal, the MC uuid rides along.
const LAUNCHER = { userId: 7, username: 'TrainerAsh', mcUuid: UUID };
const OTHER = { mcUuid: '11111111-2222-3333-4444-555555555555' };
const sha512 = 'a'.repeat(128);

// A launcher that can only parse minecraft (the pre-multi-game capability set).
const MC = ['minecraft'];

const pack = (over: Record<string, unknown> = {}) => ({
  id: 'pk1',
  slug: 'boff-smp',
  name: 'Boff SMP',
  summary: null,
  iconUrl: null,
  accessKind: 'allowlist',
  passwordHash: null,
  latestVersionId: 'v1',
  archived: false,
  createdAt: new Date('2026-07-01T00:00:00Z'),
  updatedAt: new Date('2026-07-01T00:00:00Z'),
  ...over,
});

const version = (over: Record<string, unknown> = {}) => ({
  id: 'v1',
  packId: 'pk1',
  name: '1.0.0',
  minecraft: '1.21.4',
  loader: 'neoforge',
  loaderVersion: '21.4.30',
  files: [
    {
      path: 'mods/sodium.jar',
      sha512,
      fileSize: 10,
      env: { client: 'required', server: 'required' },
      source: { kind: 'modrinth', projectId: 'p', versionId: 'v' },
    },
  ],
  published: true,
  notes: null,
  createdBy: null,
  createdAt: new Date('2026-07-02T00:00:00Z'),
  ...over,
});

describe('PacksService', () => {
  let service: PacksService;
  let repo: jest.Mocked<PacksRepository>;
  let randomizerLink: jest.Mocked<RandomizerPackLinkRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findVersion: jest.fn(),
      hasAccess: jest.fn(),
      listVisibleTo: jest.fn(),
      insertPack: jest.fn(),
      insertVersion: jest.fn(),
      grant: jest.fn(),
      grantToUser: jest.fn(),
      revokeFromUser: jest.fn(),
      listGrants: jest.fn(),
      claimLegacyGrants: jest.fn(),
      findInvite: jest.fn(),
      consumeInvite: jest.fn(),
      audit: jest.fn(),
    };

    const mockLink = { findByPackId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacksService,
        { provide: PacksRepository, useValue: mockRepo },
        { provide: RandomizerPackLinkRepository, useValue: mockLink },
      ],
    }).compile();

    service = module.get(PacksService);
    repo = module.get(PacksRepository);
    randomizerLink = module.get(RandomizerPackLinkRepository);
  });

  describe('manifestFor — the access gate', () => {
    it('serves an allowlisted pack to a UUID that has a grant', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        version: { files: unknown[] };
      };
      expect(manifest.version.files).toHaveLength(1);
      expect(repo.hasAccess).toHaveBeenCalledWith('pk1', WHO);
    });

    it('refuses an allowlisted pack to a UUID with no grant', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(false);

      await expect(service.manifestFor(OTHER, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('re-checks entitlement on every manifest request, not just at listing', async () => {
      // Revocation between listing and download: the case the re-check exists for.
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(false);
      repo.findVersion.mockResolvedValue(version() as never);

      await expect(service.manifestFor(WHO, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
      // Rejected before the version was ever loaded.
      expect(repo.findVersion).not.toHaveBeenCalled();
    });

    it('passes the principal through so entitlement can derive from membership', async () => {
      // Access is the union of a direct grant and live event membership; the
      // service must hand the repository the whole principal, not just a UUID,
      // or the membership half of the check can never run.
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      await service.manifestFor({ userId: 42 }, 'pk1', null, MC);

      expect(repo.hasAccess).toHaveBeenCalledWith('pk1', { userId: 42 });
    });

    it('serves a public pack without consulting the ACL at all', async () => {
      repo.findById.mockResolvedValue(pack({ accessKind: 'public' }) as never);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      await service.manifestFor(OTHER, 'pk1', null, MC);
      expect(repo.hasAccess).not.toHaveBeenCalled();
    });

    it('requires the right password on a password pack', async () => {
      const passwordHash = await bcrypt.hash('correcta', 10);
      repo.findById.mockResolvedValue(
        pack({ accessKind: 'password', passwordHash }) as never,
      );
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      await expect(
        service.manifestFor(WHO, 'pk1', 'incorrecta', MC),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.manifestFor(WHO, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.manifestFor(WHO, 'pk1', 'correcta', MC),
      ).resolves.toBeDefined();
    });

    it('never leaks the allowlist membership in the manifest', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        pack: { access: { kind: string; uuids?: string[] } };
      };
      expect(manifest.pack.access.kind).toBe('allowlist');
      expect(manifest.pack.access.uuids).toEqual([]);
    });

    it('hides an archived pack', async () => {
      repo.findById.mockResolvedValue(pack({ archived: true }) as never);
      await expect(service.manifestFor(WHO, 'pk1', null, MC)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not serve an unpublished version', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(
        version({ published: false }) as never,
      );
      randomizerLink.findByPackId.mockResolvedValue(null);

      await expect(service.manifestFor(WHO, 'pk1', null, MC)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('manifestFor — randomizer block injection', () => {
    it('injects randomizer block when pack is linked to open config', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue({
        id: 1,
        eventId: 42,
        gamePlatform: 'gba',
        gameTitle: 'pokered',
        settingsBlobSha512: 'b'.repeat(128),
        fvxJarSha512: 'c'.repeat(128),
        cleanRomSha512: 'd'.repeat(128),
        romHint: 'Pokémon FireRed (Spain)',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        randomizer?: { eventId: number; cleanRomSha512: string };
      };
      expect(manifest.randomizer).toEqual({
        eventId: 42,
        cleanRomSha512: 'd'.repeat(128),
      });
    });

    it('injects randomizer block when pack is linked to closed config', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue({
        id: 2,
        eventId: 99,
        gamePlatform: 'gba',
        gameTitle: 'pokered',
        settingsBlobSha512: 'b'.repeat(128),
        fvxJarSha512: 'c'.repeat(128),
        cleanRomSha512: 'e'.repeat(128),
        romHint: null,
        status: 'closed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        randomizer?: { eventId: number; cleanRomSha512: string };
      };
      expect(manifest.randomizer).toEqual({
        eventId: 99,
        cleanRomSha512: 'e'.repeat(128),
      });
    });

    it('does NOT inject randomizer block when config is draft', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue({
        id: 3,
        eventId: 123,
        gamePlatform: 'gba',
        gameTitle: 'pokered',
        settingsBlobSha512: 'b'.repeat(128),
        fvxJarSha512: 'c'.repeat(128),
        cleanRomSha512: 'f'.repeat(128),
        romHint: null,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        randomizer?: unknown;
      };
      expect(manifest.randomizer).toBeUndefined();
    });

    it('does NOT inject randomizer block when pack has no linked config', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);
      randomizerLink.findByPackId.mockResolvedValue(null);

      const manifest = (await service.manifestFor(WHO, 'pk1', null, MC)) as {
        randomizer?: unknown;
      };
      expect(manifest.randomizer).toBeUndefined();
    });
  });

  describe('createVersion — schema enforcement', () => {
    it('rejects a file whose path escapes the instance directory', async () => {
      repo.findById.mockResolvedValue(pack() as never);

      await expect(
        service.createVersion(
          'pk1',
          {
            name: '1.0',
            minecraft: '1.21.4',
            files: [
              {
                path: '../../etc/passwd',
                sha512,
                fileSize: 1,
                source: { kind: 'url', url: 'https://example.com/a.jar' },
              },
            ],
          } as never,
          null,
        ),
      ).rejects.toThrow(/no válido/i);
      expect(repo.insertVersion).not.toHaveBeenCalled();
    });

    it('rejects two files colliding only by case', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      const file = (path: string) => ({
        path,
        sha512,
        fileSize: 1,
        source: { kind: 'url', url: 'https://example.com/a.jar' },
      });

      await expect(
        service.createVersion(
          'pk1',
          {
            name: '1.0',
            minecraft: '1.21.4',
            files: [file('mods/a.jar'), file('mods/A.jar')],
          } as never,
          null,
        ),
      ).rejects.toThrow(/duplicate target path|no válido/i);
    });
  });

  describe('redeemInvite', () => {
    it('grants access when the code is consumable', async () => {
      repo.findInvite.mockResolvedValue({
        code: 'abc',
        packId: 'pk1',
      } as never);
      repo.consumeInvite.mockResolvedValue(true);

      await expect(service.redeemInvite(LAUNCHER, 'abc')).resolves.toEqual({
        packId: 'pk1',
      });
      expect(repo.grantToUser).toHaveBeenCalledWith(
        'pk1',
        7,
        'invite',
        'abc',
        null,
      );
    });

    it('grants nothing when the code is exhausted, expired or revoked', async () => {
      repo.findInvite.mockResolvedValue({
        code: 'abc',
        packId: 'pk1',
      } as never);
      repo.consumeInvite.mockResolvedValue(false);

      await expect(service.redeemInvite(LAUNCHER, 'abc')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.grantToUser).not.toHaveBeenCalled();
    });
  });

  describe('multi-game', () => {
    it('lists a pack only to a launcher that declares its game type', async () => {
      repo.listVisibleTo.mockResolvedValue([
        pack({ id: 'mc', gameType: null, latestVersionId: null }),
        pack({ id: 'emu', gameType: 'emulator', latestVersionId: null }),
      ] as never);

      const mcOnly = await service.listForLauncher(WHO, ['minecraft']);
      expect(mcOnly.map((p) => p.id)).toEqual(['mc']);
      // NULL column resolves to minecraft for the client.
      expect(mcOnly[0].gameType).toBe('minecraft');

      const both = await service.listForLauncher(WHO, [
        'minecraft',
        'emulator',
      ]);
      expect(both.map((p) => p.id).sort()).toEqual(['emu', 'mc']);
    });

    it('surfaces emulatorKind on the launcher list from the stored emulator block', async () => {
      repo.listVisibleTo.mockResolvedValue([
        pack({ id: 'emu', gameType: 'emulator', latestVersionId: 'ev' }),
      ] as never);
      repo.findVersion.mockResolvedValue(
        version({
          id: 'ev',
          minecraft: null,
          loader: null,
          emulator: { kind: 'mgba', rom: 'roms/x.gba' },
        }) as never,
      );
      const [entry] = await service.listForLauncher(WHO, [
        'minecraft',
        'emulator',
      ]);
      expect(entry.latestVersion?.emulatorKind).toBe('mgba');
      expect(entry.latestVersion?.minecraft).toBeNull();
    });

    it('409s the manifest of a pack whose game type the caller cannot parse', async () => {
      repo.findById.mockResolvedValue(pack({ gameType: 'emulator' }) as never);
      await expect(service.manifestFor(WHO, 'pk1', null, MC)).rejects.toThrow(
        ConflictException,
      );
      // Rejected before any access or version work.
      expect(repo.hasAccess).not.toHaveBeenCalled();
      expect(repo.findVersion).not.toHaveBeenCalled();
    });

    it('serves a minecraft manifest with no gameType field (byte-identical shape)', async () => {
      repo.findById.mockResolvedValue(pack({ accessKind: 'public' }) as never);
      repo.findVersion.mockResolvedValue(version() as never);
      const m = (await service.manifestFor(OTHER, 'pk1', null, MC)) as {
        pack: Record<string, unknown>;
        version: Record<string, unknown>;
      };
      expect('gameType' in m.pack).toBe(false);
      expect(m.version.dependencies).toBeDefined();
    });

    it('defaults gameType to minecraft on create and STORES it', async () => {
      repo.findBySlug.mockResolvedValue(null as never);
      await service.createPack(
        { slug: 'x', name: 'X', accessKind: 'public' } as never,
        1,
      );
      // The column is NOT NULL with a 'minecraft' default. Nullable with
      // "NULL means minecraft" would force every reader to re-implement the
      // default, and make an unset value indistinguishable from a deliberate
      // one.
      expect(repo.insertPack).toHaveBeenCalledWith(
        expect.objectContaining({ gameType: 'minecraft' }),
      );
      expect(repo.audit).toHaveBeenCalledWith(
        'pack.created',
        expect.any(String),
        null,
        expect.objectContaining({ gameType: 'minecraft' }),
      );
    });

    it('rejects a non-mc version missing its own spec block', async () => {
      repo.findById.mockResolvedValue(pack({ gameType: 'emulator' }) as never);
      await expect(
        service.createVersion(
          'pk1',
          {
            name: '1.0',
            files: [
              {
                path: 'roms/x.gba',
                sha512,
                fileSize: 1,
                source: { kind: 'user-provided', hint: 'tu volcado' },
              },
            ],
          } as never,
          null,
        ),
      ).rejects.toThrow(/no válido/i);
      expect(repo.insertVersion).not.toHaveBeenCalled();
    });

    it('accepts a well-formed emulator version and stores the spec block, minecraft NULL', async () => {
      repo.findById.mockResolvedValue(pack({ gameType: 'emulator' }) as never);
      await service.createVersion(
        'pk1',
        {
          name: '1.0',
          emulator: { kind: 'mgba', rom: 'roms/x.gba' },
          files: [
            {
              path: 'roms/x.gba',
              sha512,
              fileSize: 1,
              // The ROM entry must be client-required / server-unsupported.
              env: { client: 'required', server: 'unsupported' },
              source: { kind: 'user-provided', hint: 'tu volcado' },
            },
          ],
        } as never,
        null,
      );
      expect(repo.insertVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          minecraft: null,
          emulator: { kind: 'mgba', rom: 'roms/x.gba' },
        }),
      );
    });
  });
});
