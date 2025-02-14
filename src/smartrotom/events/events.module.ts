import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ResponseModule } from '@/response/response.module';
import { LoggerModule } from '@/logger/logger.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
  imports: [ResponseModule, LoggerModule, DrizzleModule],
})
export class EventsModule {}
