
import { Test, TestingModule } from '@nestjs/testing';
import { CommandsService } from '../_commands/commands.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { DiscordModule } from './discord.module';
import { CommandsModule } from '../_commands/commands.module';

describe('CommandsService', () => {
  let service: CommandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DiscordModule, CommandsModule],
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