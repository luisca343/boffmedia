import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { AppService } from './app.service';
import { UrlBodyDto } from './common/dto/url-body.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { promises as fs } from 'fs';
import axios from 'axios';
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

  @Get('smartrotom/patata')
  async test2() {
    const result = [];
    for (let i = 1; i <= 75; i++) {
      const prazas = i;
      const prazas_a = Math.floor(
        Math.random() * (prazas * 0.05) + prazas * 0.7,
      );
      const prazas_a_disc = prazas - prazas_a;
      const prazas_deportista = 0;
      result.push(
        `INSERT INTO prazas_cupo_adultos (COD_ASISTENCIA, PRAZAS, PRAZAS_A, PRAZAS_A_DISC, PRAZAS_DEPORTISTA) VALUES (1, ${prazas}, ${prazas_a}, ${prazas_a_disc}, ${prazas_deportista})`,
      );
      result.push(
        `INSERT INTO prazas_cupo_adultos (COD_ASISTENCIA, PRAZAS, PRAZAS_A, PRAZAS_A_DISC, PRAZAS_DEPORTISTA) VALUES (2, ${prazas}, ${prazas_a}, ${prazas_a_disc}, ${prazas_deportista})`,
      );
    }
    return result;
  }

  @Post('jcef/:sha')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('sha') sha: string,
  ) {
    await mkdir(`public/jcef/${sha}`, { recursive: true });
    const writeStream = createWriteStream(
      `public/jcef/${sha}/${file.originalname}`,
    );
    writeStream.write(file.buffer);
    return this.appService.uploadFile(file);
  }

  @Post('googlemaps')
  async googlemap(@Body() body: UrlBodyDto) {
    const data = await axios.get(body.url);
    return data.data;
  }

  @Get('blogicons')
  async blogicons() {
    return await this.appService.blogicons();
  }

  @Post('netfluis')
  async netfluis(@Body() _body: UrlBodyDto) {
    return { url: '' };
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
