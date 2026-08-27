import { Logger } from 'nestjs-pino';
import { RandomizerRepository } from './randomizer.repository';
import { AuditService } from '@api/_repositories/audit.service';

/**
 * `getPublishedEmulatorRom` is the gate every randomizer config passes through:
 * `openConfig` refuses to open and `assertConfigRomConsistent` refuses every
 * claim unless it answers `ok` with the hash the config pinned.
 *
 * Never read `version.emulator.rom` or `Array.isArray(version.files)` straight
 * off the row. MariaDB implements JSON as a LONGTEXT alias, so mysql2 returns
 * both as **strings**, and drizzle's `$type<>` is compile-time only — it parses
 * nothing. `.rom` is then `undefined`, `files` is never an array, and the gate
 * answers `no-rom` for every pack in existence, valid or not.
 *
 * These tests therefore feed the STRING shape deliberately. A suite that passed
 * pre-parsed objects would go green against exactly that fault.
 */
describe('RandomizerRepository.getPublishedEmulatorRom', () => {
  const SHA = 'e'.repeat(128);

  /** Minimal stand-in for the drizzle builder: each `select()` consumes the next
   *  queued result, in the order the method issues its two queries. */
  function repositoryReturning(...results: unknown[][]): RandomizerRepository {
    const queue = [...results];
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            execute: async () => queue.shift() ?? [],
          }),
        }),
      }),
    };
    const logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger;
    const mockAuditService = { record: jest.fn() } as any;
    return new RandomizerRepository(logger, db as never, mockAuditService);
  }

  const version = (over: Record<string, unknown> = {}) => ({
    id: 'v1',
    published: true,
    emulator: JSON.stringify({ kind: 'mgba', rom: 'roms/rom.gba' }),
    files: JSON.stringify([
      { path: 'roms/rom.gba', sha512: SHA, fileSize: 16777216 },
    ]),
    ...over,
  });

  it('resolves the ROM when MariaDB returns the JSON columns as strings', async () => {
    const repo = repositoryReturning([{ latestVersionId: 'v1' }], [version()]);

    await expect(repo.getPublishedEmulatorRom('pack1')).resolves.toEqual({
      state: 'ok',
      versionId: 'v1',
      romPath: 'roms/rom.gba',
      sha512: SHA,
    });
  });

  it('still resolves when the driver hands back parsed objects', async () => {
    // MySQL proper does parse them, and the same code serves both.
    const repo = repositoryReturning(
      [{ latestVersionId: 'v1' }],
      [
        version({
          emulator: { kind: 'mgba', rom: 'roms/rom.gba' },
          files: [{ path: 'roms/rom.gba', sha512: SHA }],
        }),
      ],
    );

    await expect(repo.getPublishedEmulatorRom('pack1')).resolves.toMatchObject({
      state: 'ok',
      sha512: SHA,
    });
  });

  it('reports no-rom when the emulator block names a path no file declares', async () => {
    const repo = repositoryReturning(
      [{ latestVersionId: 'v1' }],
      [
        version({
          files: JSON.stringify([{ path: 'roms/other.gba', sha512: SHA }]),
        }),
      ],
    );

    await expect(repo.getPublishedEmulatorRom('pack1')).resolves.toEqual({
      state: 'no-rom',
    });
  });

  it('reports no-rom rather than throwing on unparseable JSON', async () => {
    // A malformed manifest must fail the caller's validity check, not escape as
    // a 500 out of a read.
    const repo = repositoryReturning(
      [{ latestVersionId: 'v1' }],
      [version({ emulator: '{not json' })],
    );

    await expect(repo.getPublishedEmulatorRom('pack1')).resolves.toEqual({
      state: 'no-rom',
    });
  });

  it('reports no-version for a pack with no latest version, and for an unpublished one', async () => {
    await expect(
      repositoryReturning([{ latestVersionId: null }]).getPublishedEmulatorRom(
        'pack1',
      ),
    ).resolves.toEqual({ state: 'no-version' });

    await expect(
      repositoryReturning(
        [{ latestVersionId: 'v1' }],
        [version({ published: false })],
      ).getPublishedEmulatorRom('pack1'),
    ).resolves.toEqual({ state: 'no-version' });
  });

  it('returns null for an unknown pack and for an empty id', async () => {
    await expect(
      repositoryReturning([]).getPublishedEmulatorRom('nope'),
    ).resolves.toBeNull();
    await expect(
      repositoryReturning().getPublishedEmulatorRom(''),
    ).resolves.toBeNull();
  });
});
