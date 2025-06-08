import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PtcgpController } from './ptcgp.controller';
import { ConfigService } from '@api/config.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { TgcpCardService } from './card.service';
import { TgcpUserCardService } from './user-card.service';
import { TgcpPackService } from './pack.service';
import { TgcpScraperService } from './scraper.service';
import { PtcgpBattleService } from './battle.service';

@Module({
  imports: [ConfigModule],
  controllers: [PtcgpController],
  providers: [
    TgcpCardService,
    TgcpUserCardService,
    TgcpPackService,
    TgcpScraperService,
    ConfigService,
    PtcgpBattleService,
    MySQL2Service
  ],
})
export class PtcgpModule {}