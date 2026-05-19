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
    it('inserts image record via Drizzle', () => {
      service.createImage('boffmedia', 'screenshot', 'png', 'abc123');

      expect(mockDrizzle.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        app: 'boffmedia',
        name: 'screenshot',
        extension: 'png',
        key: 'abc123',
      });
      expect(mockInsert.execute).toHaveBeenCalled();
    });
  });
});
