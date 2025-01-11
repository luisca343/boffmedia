import { Module } from '@nestjs/common';
import { NetfluisController } from './netfluis.controller';
import { NetfluisService } from './netfluis.service';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  controllers: [NetfluisController],
  providers: [NetfluisService],
  exports: [NetfluisService],
  imports: [DrizzleModule]
})
export class NetfluisModule {}
