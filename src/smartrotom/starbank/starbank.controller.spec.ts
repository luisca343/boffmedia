import { Test, TestingModule } from '@nestjs/testing';
import { StarbankController } from './starbank.controller';

describe('StarbankController', () => {
  let controller: StarbankController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StarbankController],
    }).compile();

    controller = module.get<StarbankController>(StarbankController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
