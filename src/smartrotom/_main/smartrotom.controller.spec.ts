import { Test, TestingModule } from '@nestjs/testing';
import { SmartrotomController } from './smartrotom.controller';

describe('SmartrotomController', () => {
  let controller: SmartrotomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmartrotomController],
    }).compile();

    controller = module.get<SmartrotomController>(SmartrotomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
