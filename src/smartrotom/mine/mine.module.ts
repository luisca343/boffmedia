import { Module } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { MinaService } from './mine.service';
import { MinaController } from './mine.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  providers: [MinaService, MySQL2Service],
  controllers: [MinaController],
})
export class DocumentsModule {}
