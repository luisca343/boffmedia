import { Test, TestingModule } from '@nestjs/testing';
import { SharexService } from './sharex.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

const mockInsert = { values: jest.fn().mockReturnThis(), execute: jest.fn() };
const mockDrizzle = { insert: jest.fn().mockReturnValue(mockInsert) };
const mockDb = { getDrizzle: jest.fn().mockReturnValue(mockDrizzle) };

describe('SharexService', () => {
  let service: SharexService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharexService, { provide: MySQL2Service, useValue: mockDb }],
    }).compile();

    service = module.get<SharexService>(SharexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createImage()', () => {
    // Stores the token id, not the raw key. The old `key` column held the same
    // shared secret on every row, so it attributed an upload to nobody.
    it('inserts the image attributed to the uploading token', () => {
      service.createImage('boffmedia', 'screenshot', 'png', 7);

      expect(mockDrizzle.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        app: 'boffmedia',
        name: 'screenshot',
        extension: 'png',
        tokenId: 7,
      });
      expect(mockInsert.execute).toHaveBeenCalled();
    });
  });
});
