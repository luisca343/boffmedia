import { Test, TestingModule } from '@nestjs/testing';
import { SmartRotomUsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmartrotomUser } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: SmartRotomUsersService;
  let repo: Repository<SmartrotomUser>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartRotomUsersService,
        {
          provide: getRepositoryToken(SmartrotomUser),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SmartRotomUsersService>(SmartRotomUsersService);
    repo = module.get<Repository<SmartrotomUser>>(getRepositoryToken(SmartrotomUser));
  });

  it('should create a user', async () => {
    const dto = { username: 'Test User', uuid: 'test' };
    repo.create = jest.fn().mockReturnValue(dto);
    repo.save = jest.fn().mockResolvedValue(dto);

    const result = await service.create(dto);

    expect(result).toEqual(dto);
  });

  it('should find all users', async () => {
    const result = await service.findAll();

    expect(result).toEqual('This action returns all users');
  });

  it('should find one user', async () => {
    const uuid = '123';
    const user = { uuid, name: 'Test User', email: 'test@example.com' };
    repo.findOne = jest.fn().mockResolvedValue(user);

    const result = await service.findOne(uuid);

    expect(result).toEqual(user);
  });

  it('should update a user', async () => {
    const id = 1;
    const result = await service.update(id, {});

    expect(result).toEqual(`This action updates a #${id} user`);
  });

  it('should remove a user', async () => {
    const id = 1;
    const result = await service.remove(id);

    expect(result).toEqual(`This action removes a #${id} user`);
  });

});
