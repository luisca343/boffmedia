import { Test, TestingModule } from '@nestjs/testing';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { Repository, UpdateResult } from 'typeorm';

describe('AppsController', () => {
  let controller: AppsController;
  let service: AppsService;
  let repo: Repository<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsController],
      providers: [
        AppsService,
        { provide: 'AppRepository', useClass: Repository }, // provide a mock for AppRepository
      ],
    }).compile();

    controller = module.get<AppsController>(AppsController);
    service = module.get<AppsService>(AppsService);
    repo = module.get<Repository<any>>('AppRepository'); // get the mock AppRepository
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an app', async () => {
      const app = { id: 1, name: 'Test App', description: 'Test Description' };
      jest.spyOn(repo, 'save').mockResolvedValue(app);

      expect(await service.create(app)).toEqual(app);
    });
  });

  describe('findAll', () => {
    it('should return an array of apps', async () => {
      const apps = [{ id: 1, name: 'Test App', description: 'Test Description' }];
      jest.spyOn(repo, 'find').mockResolvedValue(apps);

      expect(await service.findAll()).toEqual(apps);
    });
  });

  describe('findOne', () => {
    it('should return an app', async () => {
      const result = { id: 1, name: 'Test App', description: 'Test Description' };
      jest.spyOn(repo, 'findOneBy').mockImplementation(() => Promise.resolve(result));

      expect(await service.findOne(1)).toBe(result);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('update', () => {
    it('should update an app', async () => {
      const updateAppDto = { id: 1, name: 'Test App', description: 'Test Description' };
      const result = { id: 1, ...updateAppDto, raw: [], generatedMaps: []};
      jest.spyOn(repo, 'update').mockImplementation(() => Promise.resolve(result));

      expect(await service.update(1, updateAppDto)).toBe(result);
      expect(repo.update).toHaveBeenCalledWith(1, updateAppDto);
    });
  });

  describe('remove', () => {
    it('should remove an app', async () => {
      const result = { raw: [], affected: 1, generatedMaps: []};
      jest.spyOn(repo, 'softDelete').mockImplementation(() => Promise.resolve(result));

      expect(await service.remove(1)).toBe(result);
      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });
  });
  

});