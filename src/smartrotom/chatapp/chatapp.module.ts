import { Module } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ChatappController } from './chatapp.controller';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Module({
    providers: [ChatappService, MySQL2Service, SocketsGateway],
    controllers: [ChatappController],
    exports: [ChatappService]
  })
export class ChatappModule {}
