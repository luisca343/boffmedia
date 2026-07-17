import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';
import { CajaRepository } from './repositories/caja.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [CajaController],
  providers: [CajaService, CajaRepository],
  exports: [CajaService, CajaRepository],
})
export class CajaModule {}
