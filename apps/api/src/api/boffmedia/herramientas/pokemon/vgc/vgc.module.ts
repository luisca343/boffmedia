import { Module } from '@nestjs/common';
import { VgcController } from './vgc.controller';
import { VgcService } from './vgc.service';

@Module({
  controllers: [VgcController],
  providers: [VgcService],
  exports: [VgcService],
})
export class VgcModule {}
