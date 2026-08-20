import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { AppService } from './app.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { SkipEnvelope } from './common/decorators/skip-envelope.decorator';

@ApiTags('Boffmedia')
@Public()
@Controller()
@SkipEnvelope()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('zomboid')
  async zomboid() {
    const filePath = join(process.cwd(), 'data', 'zomboid', 'data.txt');
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const lines = data.split('\n');
      const result: Record<string, any> = {};

      lines.forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
          const baseKey = key.replace(/Date$/, '');
          if (!result[baseKey]) {
            result[baseKey] = {};
          }
          if (key.endsWith('Date')) {
            result[baseKey].date = Number(value);
          } else {
            result[baseKey].value = Number(value);
          }
        }
      });

      return result;
    } catch (_err: any) {
      return { error: 'Failed to read file' };
    }
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  getDBPort(): number {
    return this.appService.getDBPort();
  }

  @Get('togglelogging')
  toggleLogging() {
    return { logging: this.appService.toggleLogging() };
  }

  @Get('blogicons')
  async blogicons() {
    return await this.appService.blogicons();
  }

  @Get('steamkeys')
  async steamkeys() {
    return await this.appService.steamKeys();
  }

  @Get('steamdata/:steamID')
  async steamData(@Param('steamID') steamID: string) {
    return await this.appService.getSteamData(steamID);
  }

  /**
   * Games that are 100 % off on Steam right now — the API-side mirror of
   * store.steampowered.com/search/?maxprice=free&category1=998&specials=1.
   * The lang query is the UI locale (es|en); prices are always quoted in EUR.
   */
  @Get('steamfree')
  async steamFree(@Query('lang') lang?: string) {
    return await this.appService.getSteamFreeGames(lang);
  }
}
