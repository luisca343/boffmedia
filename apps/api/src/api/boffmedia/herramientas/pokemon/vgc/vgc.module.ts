import { Module } from '@nestjs/common';
import { VgcController } from './vgc.controller';
import { VgcService } from './vgc.service';
import { TrackerModule } from './tracker/tracker.module';

@Module({
  imports: [TrackerModule],
  controllers: [VgcController],
  providers: [VgcService],
  exports: [VgcService],
})
export class VgcModule {}
