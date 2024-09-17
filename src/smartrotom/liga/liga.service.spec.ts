import { Test, TestingModule } from '@nestjs/testing';
import { LigaService } from './liga.service';

describe('LigaService', () => {
  let service: LigaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LigaService],
    }).compile();

    service = module.get<LigaService>(LigaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
