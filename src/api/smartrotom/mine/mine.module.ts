import { Module } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { MinaService } from './mine.service';
import { MinaController } from './mine.controller';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  providers: [MinaService],
  controllers: [MinaController],
})
export class DocumentsModule {}
