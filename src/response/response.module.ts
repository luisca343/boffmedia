import { Module } from '@nestjs/common';
import { ResponseService } from './response.service';
import { LoggerModule } from '@/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseModule {}