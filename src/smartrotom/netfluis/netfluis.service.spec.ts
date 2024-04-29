import { Test, TestingModule } from '@nestjs/testing';
import { NetfluisService } from './netfluis.service';

describe('NetfluisService', () => {
  let service: NetfluisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NetfluisService],
    }).compile();

    service = module.get<NetfluisService>(NetfluisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
