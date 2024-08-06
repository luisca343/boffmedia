import { Module } from '@nestjs/common';
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [SmartrotomController],
  providers: [SmartrotomService, MySQL2Service],
  exports: [SmartrotomService]
})
export class SmartrotomModule {}
