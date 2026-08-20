import { Module } from '@nestjs/common';
import { SharexController } from './sharex.controller';
import { SharexTokensController } from './sharex-tokens.controller';
import { SharexService } from './sharex.service';
import { SharexTokensService } from './sharex-tokens.service';
import { MySQL2Module } from '@/_utils/MySQL2.module';

@Module({
  imports: [MySQL2Module],
  controllers: [SharexController, SharexTokensController],
  providers: [SharexService, SharexTokensService],
})
export class SharexModule {}
