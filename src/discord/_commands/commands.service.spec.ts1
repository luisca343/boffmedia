import { Test, TestingModule } from '@nestjs/testing';
import { CommandsService } from './commands.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { CommandsModule } from './commands.module';

describe('CommandsService', () => {
  let service: CommandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommandsModule],
    })
    .overrideProvider(MySQL2Service)
    .useValue({})
    .compile();

    service = module.get<CommandsService>(CommandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});