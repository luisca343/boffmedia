import { Test, TestingModule } from '@nestjs/testing';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';
import { DesktopRelease } from '@/_db/schema/DesktopReleases';

describe('DesktopUpdatesService', () => {
  let service: DesktopUpdatesService;
  let repository: DesktopReleasesRepository;

  const mockRelease = (
    overrides?: Partial<DesktopRelease>,
  ): DesktopRelease => ({
    id: 1,
    version: '1.0.0',
    target: 'windows-x86_64',
    signature: 'test-sig',
    notes: 'Test release',
    artifactName: 'test.exe',
    artifactSha512: 'abc123',
    sizeBytes: 1000,
    published: true,
    publishedAt: new Date(),
    uploadedBy: 1,
    rolloutPercent: 100,
    paused: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesktopUpdatesService,
        {
          provide: DesktopReleasesRepository,
          useValue: {
            listPublishedForTarget: jest.fn(),
            findById: jest.fn(),
            setRolloutPercent: jest.fn(),
            setPaused: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DesktopUpdatesService>(DesktopUpdatesService);
    repository = module.get<DesktopReleasesRepository>(
      DesktopReleasesRepository,
    );
  });

  describe('feed with rollout and paused', () => {
    it('should not offer a paused release even if published and in rollout', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: true,
        rolloutPercent: 100,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const result = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId: 'device-001' },
      );

      expect(result).toBeNull();
    });

    it('should offer a release at 100% rollout to all clients', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: false,
        rolloutPercent: 100,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const result = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId: 'device-001' },
      );

      expect(result).not.toBeNull();
      expect(result?.version).toBe('2.0.0');
    });

    it('should offer a release at 0% rollout to no clients', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: false,
        rolloutPercent: 0,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const result = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId: 'device-001' },
      );

      expect(result).toBeNull();
    });

    it('should consistently assign the same device to the same rollout bucket', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: false,
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      // Same device ID should get the same answer on repeated calls
      const deviceId = 'stable-device-001';
      const result1 = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId },
      );

      const result2 = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId },
      );

      // Both should be the same (either both included or both excluded)
      if (result1 === null) {
        expect(result2).toBeNull();
      } else {
        expect(result2).not.toBeNull();
        expect(result2?.version).toBe(result1?.version);
      }
    });

    it('should split population evenly across rollout percentages', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: false,
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      // Test 100 different device IDs to verify ~50% get the release
      let includedCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = await service.feed(
          'windows-x86_64',
          '1.0.0',
          'http://localhost:3000',
          { deviceId: `device-${i}` },
        );
        if (result !== null) {
          includedCount++;
        }
      }

      // With 100 devices and 50% rollout, we expect ~50 to be included.
      // Allow 10% variance to account for hash distribution
      expect(includedCount).toBeGreaterThanOrEqual(40);
      expect(includedCount).toBeLessThanOrEqual(60);
    });

    it('should handle clients without device ID (default include)', async () => {
      const release = mockRelease({
        version: '2.0.0',
        paused: false,
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      // No clientId provided - should default to including the release
      const result = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        undefined,
      );

      expect(result).not.toBeNull();
      expect(result?.version).toBe('2.0.0');
    });

    it('should filter out both paused and out-of-rollout releases', async () => {
      const releases = [
        mockRelease({
          id: 1,
          version: '2.0.0',
          paused: true,
          rolloutPercent: 100,
        }),
        mockRelease({
          id: 2,
          version: '3.0.0',
          paused: false,
          rolloutPercent: 0,
        }),
        mockRelease({
          id: 3,
          version: '4.0.0',
          paused: false,
          rolloutPercent: 100,
        }),
      ];

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue(releases);

      const result = await service.feed(
        'windows-x86_64',
        '1.0.0',
        'http://localhost:3000',
        { deviceId: 'device-001' },
      );

      // Should offer the newest eligible release (4.0.0)
      expect(result?.version).toBe('4.0.0');
    });
  });
});
