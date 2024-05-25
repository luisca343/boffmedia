import { Test, TestingModule } from '@nestjs/testing';
import { MisionesService } from './misiones.service';

describe('MisionesService', () => {
  let service: MisionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MisionesService],
    }).compile();

    service = module.get<MisionesService>(MisionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
