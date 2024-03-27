import { Test, TestingModule } from '@nestjs/testing';
import { StarbankService } from './starbank.service';

describe('StarbankService', () => {
  let service: StarbankService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StarbankService],
    }).compile();

    service = module.get<StarbankService>(StarbankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
