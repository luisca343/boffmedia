import { Module, forwardRef } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ChatappController } from './chatapp.controller';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { SocketsModule } from '../sockets/sockets.module';
import { ResponseModule } from '@/response/response.module';
import { LoggerModule } from '@/logger/logger.module';

@Module({
    providers: [ChatappService, MySQL2Service],
    controllers: [ChatappController],
    exports: [ChatappService],
    imports: [forwardRef(() => SocketsModule), ResponseModule, LoggerModule],
  })
export class ChatappModule {}
