import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { DesktopTelemetryController } from './desktop-telemetry.controller';
import { DesktopTelemetryService } from './desktop-telemetry.service';
import { DesktopTelemetryRepository } from './repositories/desktop-telemetry.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [DesktopTelemetryController],
  providers: [DesktopTelemetryService, DesktopTelemetryRepository],
})
export class DesktopTelemetryModule {}
