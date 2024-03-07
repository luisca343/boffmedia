import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmartrotomUser } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Response } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let repo: Repository<SmartrotomUser>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(SmartrotomUser),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<SmartrotomUser>>(getRepositoryToken(SmartrotomUser));
  
  });

  it('should find or create a user', async () => {
    const mcUser = { uuid: '123', username: 'Test User', world: 'test' };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    service.findOne = jest.fn().mockResolvedValue(null);
    service.create = jest.fn().mockResolvedValue(mcUser);

    await controller.findUser(mcUser, res as Response);

    expect(service.findOne).toHaveBeenCalledWith(mcUser.uuid);
    expect(service.create).toHaveBeenCalledWith(mcUser);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(mcUser);
  });
});