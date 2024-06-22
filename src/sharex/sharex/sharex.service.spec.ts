import { Test, TestingModule } from '@nestjs/testing';
import { SharexService } from './sharex.service';

describe('SharexService', () => {
  let service: SharexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharexService],
    }).compile();

    service = module.get<SharexService>(SharexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
