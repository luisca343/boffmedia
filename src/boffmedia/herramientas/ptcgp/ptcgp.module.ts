import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PtcgpService } from './ptcgp.service';
import { PtcgpController } from './ptcgp.controller';
import { ConfigService } from '../../../config.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  imports: [ConfigModule],
  controllers: [PtcgpController],
  providers: [PtcgpService, ConfigService, MySQL2Service],
})
export class PtcgpModule {}