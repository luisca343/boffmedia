import { Module } from '@nestjs/common';
import { VgcController } from './vgc.controller';
import { VgcService } from './vgc.service';
import { TrackerModule } from './tracker/tracker.module';
import { VgcMetaModule } from './meta/meta.module';

@Module({
  imports: [TrackerModule, VgcMetaModule],
  controllers: [VgcController],
  providers: [VgcService],
  exports: [VgcService, VgcMetaModule],
})
export class VgcModule {}
