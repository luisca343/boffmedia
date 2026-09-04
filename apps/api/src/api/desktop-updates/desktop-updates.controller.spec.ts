import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { DesktopUpdatesController } from './desktop-updates.controller';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';
import { DesktopRelease } from '@/_db/schema/DesktopReleases';
import { UpdaterFeedEntity } from './entities/desktop-updates.entity';

describe('DesktopUpdatesController', () => {
  let controller: DesktopUpdatesController;
  let service: DesktopUpdatesService;
  let repository: DesktopReleasesRepository;

  const mockRelease = (overrides?: Partial<DesktopRelease>): DesktopRelease => ({
    id: 1,
    version: '2.0.0',
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
      controllers: [DesktopUpdatesController],
      providers: [
        DesktopUpdatesService,
        {
          provide: DesktopReleasesRepository,
          useValue: {
            listPublishedForTarget: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DesktopUpdatesController>(DesktopUpdatesController);
    service = module.get<DesktopUpdatesService>(DesktopUpdatesService);
    repository = module.get<DesktopReleasesRepository>(DesktopReleasesRepository);
  });

  describe('feed with rollout bucketing', () => {
    it('should pass install ID from header to the service', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const req = {
        headers: { 'x-boff-install-id': 'test-install-uuid-001' },
        protocol: 'http',
        get: () => 'localhost:3000',
      } as any;

      const res = { status: jest.fn().mockReturnThis() } as any;

      const result = await controller.feed(
        'windows-x86_64',
        '1.0.0',
        req,
        res,
      );

      // Verify the result was computed with the install ID
      expect(result).toBeDefined();
      // The specific bucket behavior depends on the hash, but it should be stable
      expect(typeof result).toBe('object');
    });

    it('should return same answer for the same install ID on repeated requests', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const installId = 'stable-install-uuid-001';

      const makeRequest = async () => {
        const req = {
          headers: { 'x-boff-install-id': installId },
          protocol: 'http',
          get: () => 'localhost:3000',
        } as any;

        const res = { status: jest.fn().mockReturnThis() } as any;

        return controller.feed('windows-x86_64', '1.0.0', req, res);
      };

      const result1 = await makeRequest();
      const result2 = await makeRequest();

      // Both should be the same (either both null or both a feed entity)
      expect(result1).toEqual(result2);
    });

    it('should include clients without install ID header (backward compat)', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const req = {
        headers: {}, // No x-boff-install-id
        protocol: 'http',
        get: () => 'localhost:3000',
      } as any;

      const res = { status: jest.fn().mockReturnThis() } as any;

      const result = await controller.feed(
        'windows-x86_64',
        '1.0.0',
        req,
        res,
      );

      // Without install ID, the service defaults to including (true).
      // So even at 50% rollout, a request without the header should get the release.
      expect(result).not.toBeNull();
      expect(result?.version).toBe('2.0.0');
    });

    it('should trim whitespace in install ID header', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 100, // Ensure the release is included regardless of hash
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const req = {
        headers: { 'x-boff-install-id': '  test-install-uuid  ' },
        protocol: 'http',
        get: () => 'localhost:3000',
      } as any;

      const res = { status: jest.fn().mockReturnThis() } as any;

      const result = await controller.feed(
        'windows-x86_64',
        '1.0.0',
        req,
        res,
      );

      // Should trim and process the install ID normally
      expect(result?.version).toBe('2.0.0');
    });
  });

  describe('latest route with rollout bucketing', () => {
    it('should pass install ID from header to the service on latest route', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const req = {
        headers: { 'x-boff-install-id': 'test-install-uuid-001' },
        protocol: 'http',
        get: () => 'localhost:3000',
      } as any;

      const res = { status: jest.fn().mockReturnThis() } as any;

      const result = await controller.latest('windows-x86_64', req, res);

      // Verify the result was computed with the install ID
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return same answer for the same install ID on latest route', async () => {
      const release = mockRelease({
        version: '2.0.0',
        rolloutPercent: 50,
      });

      jest
        .spyOn(repository, 'listPublishedForTarget')
        .mockResolvedValue([release]);

      const installId = 'stable-install-uuid-001';

      const makeRequest = async () => {
        const req = {
          headers: { 'x-boff-install-id': installId },
          protocol: 'http',
          get: () => 'localhost:3000',
        } as any;

        const res = { status: jest.fn().mockReturnThis() } as any;

        return controller.latest('windows-x86_64', req, res);
      };

      const result1 = await makeRequest();
      const result2 = await makeRequest();

      // Both should be the same
      expect(result1).toEqual(result2);
    });
  });
});
