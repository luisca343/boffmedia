import { Test, TestingModule } from '@nestjs/testing';
import { PtcgpService } from './ptcgp.service';

describe('PtcgpService', () => {
  let service: PtcgpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PtcgpService],
    }).compile();

    service = module.get<PtcgpService>(PtcgpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
