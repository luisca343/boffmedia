import { Module } from '@nestjs/common';
import { NetfluisController } from './netfluis.controller';
import { NetfluisService } from './netfluis.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [NetfluisController],
  providers: [NetfluisService, MySQL2Service],
  exports: [NetfluisService],
})
export class NetfluisModule {}
