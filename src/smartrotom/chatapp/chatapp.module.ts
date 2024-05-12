import { Module } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ChatappController } from './chatapp.controller';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { SocketsModule } from '../sockets/sockets.module';

@Module({
    providers: [ChatappService, MySQL2Service],
    controllers: [ChatappController],
    exports: [ChatappService],
    imports: [SocketsModule]
  })
export class ChatappModule {}
