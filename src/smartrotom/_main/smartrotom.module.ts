import { Module } from '@nestjs/common';
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [SmartrotomController],
  providers: [SmartrotomService, MySQL2Service],
  exports: [SmartrotomService]
})
export class SmartrotomModule {}
