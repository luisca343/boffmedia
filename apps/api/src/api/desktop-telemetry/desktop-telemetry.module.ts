import { Module } from '@nestjs/common';
import { DesktopTelemetryController } from './desktop-telemetry.controller';
import { DesktopTelemetryService } from './desktop-telemetry.service';

@Module({
  controllers: [DesktopTelemetryController],
  providers: [DesktopTelemetryService],
})
export class DesktopTelemetryModule {}
