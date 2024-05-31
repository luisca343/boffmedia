import { Test, TestingModule } from '@nestjs/testing';
import { SmartrotomService } from './smartrotom.service';

describe('SmartrotomService', () => {
  let service: SmartrotomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmartrotomService],
    }).compile();

    service = module.get<SmartrotomService>(SmartrotomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
