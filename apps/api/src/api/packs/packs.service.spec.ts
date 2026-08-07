import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PacksRepository } from './packs.repository';
import { PacksService } from './packs.service';

// These tests concentrate on the ONE thing worth being paranoid about: who can
// obtain a manifest. Everything else in this module is CRUD; this is the part
// where a mistake hands a private pack to the wrong person.

const UUID = '069a79f4-44e9-4726-a5be-fca90e38aaf5';
const OTHER = '11111111-2222-3333-4444-555555555555';
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
      findInvite: jest.fn(),
      consumeInvite: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacksService,
        { provide: PacksRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(PacksService);
    repo = module.get(PacksRepository);
  });

  describe('manifestFor — the access gate', () => {
    it('serves an allowlisted pack to a UUID that has a grant', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);

      const manifest = (await service.manifestFor(UUID, 'pk1', null, MC)) as {
        version: { files: unknown[] };
      };
      expect(manifest.version.files).toHaveLength(1);
      expect(repo.hasAccess).toHaveBeenCalledWith('pk1', UUID);
    });

    it('refuses an allowlisted pack to a UUID with no grant', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(false);

      await expect(service.manifestFor(OTHER, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('re-checks entitlement on every manifest request, not just at listing', async () => {
      // Revocation between listing and download is the case §7.4 exists for.
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(false);
      repo.findVersion.mockResolvedValue(version() as never);

      await expect(service.manifestFor(UUID, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
      // Rejected before the version was ever loaded.
      expect(repo.findVersion).not.toHaveBeenCalled();
    });

    it('serves a public pack without consulting the ACL at all', async () => {
      repo.findById.mockResolvedValue(pack({ accessKind: 'public' }) as never);
      repo.findVersion.mockResolvedValue(version() as never);

      await service.manifestFor(OTHER, 'pk1', null, MC);
      expect(repo.hasAccess).not.toHaveBeenCalled();
    });

    it('requires the right password on a password pack', async () => {
      const passwordHash = await bcrypt.hash('correcta', 10);
      repo.findById.mockResolvedValue(
        pack({ accessKind: 'password', passwordHash }) as never,
      );
      repo.findVersion.mockResolvedValue(version() as never);

      await expect(
        service.manifestFor(UUID, 'pk1', 'incorrecta', MC),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.manifestFor(UUID, 'pk1', null, MC)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.manifestFor(UUID, 'pk1', 'correcta', MC),
      ).resolves.toBeDefined();
    });

    it('never leaks the allowlist membership in the manifest', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(version() as never);

      const manifest = (await service.manifestFor(UUID, 'pk1', null, MC)) as {
        pack: { access: { kind: string; uuids?: string[] } };
      };
      expect(manifest.pack.access.kind).toBe('allowlist');
      expect(manifest.pack.access.uuids).toEqual([]);
    });

    it('hides an archived pack', async () => {
      repo.findById.mockResolvedValue(pack({ archived: true }) as never);
      await expect(service.manifestFor(UUID, 'pk1', null, MC)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not serve an unpublished version', async () => {
      repo.findById.mockResolvedValue(pack() as never);
      repo.hasAccess.mockResolvedValue(true);
      repo.findVersion.mockResolvedValue(
        version({ published: false }) as never,
      );

      await expect(service.manifestFor(UUID, 'pk1', null, MC)).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(service.redeemInvite(UUID, 'abc')).resolves.toEqual({
        packId: 'pk1',
      });
      expect(repo.grant).toHaveBeenCalledWith('pk1', UUID, null, 'abc');
    });

    it('grants nothing when the code is exhausted, expired or revoked', async () => {
      repo.findInvite.mockResolvedValue({
        code: 'abc',
        packId: 'pk1',
      } as never);
      repo.consumeInvite.mockResolvedValue(false);

      await expect(service.redeemInvite(UUID, 'abc')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.grant).not.toHaveBeenCalled();
    });
  });

  describe('multi-game', () => {
    it('lists a pack only to a launcher that declares its game type', async () => {
      repo.listVisibleTo.mockResolvedValue([
        pack({ id: 'mc', gameType: null, latestVersionId: null }),
        pack({ id: 'emu', gameType: 'emulator', latestVersionId: null }),
      ] as never);

      const mcOnly = await service.listForLauncher(UUID, ['minecraft']);
      expect(mcOnly.map((p) => p.id)).toEqual(['mc']);
      // NULL column resolves to minecraft for the client.
      expect(mcOnly[0].gameType).toBe('minecraft');

      const both = await service.listForLauncher(UUID, [
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
      const [entry] = await service.listForLauncher(UUID, [
        'minecraft',
        'emulator',
      ]);
      expect(entry.latestVersion?.emulatorKind).toBe('mgba');
      expect(entry.latestVersion?.minecraft).toBeNull();
    });

    it('409s the manifest of a pack whose game type the caller cannot parse', async () => {
      repo.findById.mockResolvedValue(pack({ gameType: 'emulator' }) as never);
      await expect(service.manifestFor(UUID, 'pk1', null, MC)).rejects.toThrow(
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

    it('defaults gameType to minecraft on create and stores NULL', async () => {
      repo.findBySlug.mockResolvedValue(null as never);
      await service.createPack(
        { slug: 'x', name: 'X', accessKind: 'public' } as never,
        1,
      );
      expect(repo.insertPack).toHaveBeenCalledWith(
        expect.objectContaining({ gameType: null }),
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
              // Cycle 2: the ROM entry must be client-required / server-unsupported.
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
