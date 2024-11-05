import { Test, TestingModule } from '@nestjs/testing';
import { PtcgpController } from './ptcgp.controller';

describe('PtcgpController', () => {
  let controller: PtcgpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PtcgpController],
    }).compile();

    controller = module.get<PtcgpController>(PtcgpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
