import { Test, TestingModule } from '@nestjs/testing';
import { NetfluisController } from './netfluis.controller';

describe('NetfluisController', () => {
  let controller: NetfluisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetfluisController],
    }).compile();

    controller = module.get<NetfluisController>(NetfluisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
