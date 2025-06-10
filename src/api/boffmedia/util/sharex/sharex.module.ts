import { Module } from '@nestjs/common';
import { SharexController } from './sharex.controller';
import { SharexService } from './sharex.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [SharexController],
  providers: [SharexService, MySQL2Service],
})
export class SharexModule {}
