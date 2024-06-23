import { Module } from '@nestjs/common';
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';

@Module({
  controllers: [SmartrotomController],
  providers: [SmartrotomService],
  exports: [SmartrotomService]
})
export class SmartrotomModule {}
