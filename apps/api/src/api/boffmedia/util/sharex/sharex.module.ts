import { Module } from '@nestjs/common';
import { SharexController } from './sharex.controller';
import { SharexService } from './sharex.service';
import { MySQL2Module } from '@/_utils/MySQL2.module';

@Module({
  imports: [MySQL2Module],
  controllers: [SharexController],
  providers: [SharexService],
})
export class SharexModule {}
