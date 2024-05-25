import { Test, TestingModule } from '@nestjs/testing';
import { MisionesController } from './misiones.controller';

describe('MisionesController', () => {
  let controller: MisionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MisionesController],
    }).compile();

    controller = module.get<MisionesController>(MisionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
