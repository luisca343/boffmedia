import { Test, TestingModule } from '@nestjs/testing';
import { SharexController } from './sharex.controller';

describe('SharexController', () => {
  let controller: SharexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharexController],
    }).compile();

    controller = module.get<SharexController>(SharexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
