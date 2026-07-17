import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';
import { CajaReservationSweeper } from './caja-reservation-sweeper.service';
import { CajaRepository } from './repositories/caja.repository';

@Module({
  imports: [DrizzleModule, ScheduleModule.forRoot()],
  controllers: [CajaController],
  providers: [CajaService, CajaReservationSweeper, CajaRepository],
  exports: [CajaService, CajaRepository],
})
export class CajaModule {}
