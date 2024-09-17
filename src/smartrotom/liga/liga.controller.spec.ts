import { Test, TestingModule } from '@nestjs/testing';
import { LigaController } from './liga.controller';

describe('LigaController', () => {
  let controller: LigaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LigaController],
    }).compile();

    controller = module.get<LigaController>(LigaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
