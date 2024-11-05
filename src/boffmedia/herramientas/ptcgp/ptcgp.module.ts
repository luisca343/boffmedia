import { Module } from '@nestjs/common';
import { PtcgpService } from './ptcgp.service';
import { PtcgpController } from './ptcgp.controller';

@Module({
  controllers: [PtcgpController],
  providers: [PtcgpService],
})
export class PtcgpModule {}
