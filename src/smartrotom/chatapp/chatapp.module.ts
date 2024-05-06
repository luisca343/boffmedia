import { Module } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ChatappController } from './chatapp.controller';

@Module({
    providers: [ChatappService, MySQL2Service],
    controllers: [ChatappController],
    exports: [ChatappService],
  })
export class ChatappModule {}
