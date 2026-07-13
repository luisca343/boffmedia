import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PasaporteController } from './pasaporte.controller';
import { PasaporteRepository } from './pasaporte.repository';
import { PasaporteService } from './pasaporte.service';

@Module({
  imports: [DrizzleModule],
  controllers: [PasaporteController],
  providers: [PasaporteRepository, PasaporteService],
  exports: [PasaporteService],
})
export class PasaporteModule {}
