import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PtcgpService } from './ptcgp.service';
import { PtcgpController } from './ptcgp.controller';
import { ConfigService } from '../../../config.service';

@Module({
  imports: [ConfigModule],
  controllers: [PtcgpController],
  providers: [PtcgpService, ConfigService],
})
export class PtcgpModule {}