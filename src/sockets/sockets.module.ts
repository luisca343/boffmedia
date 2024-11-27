import { Module, forwardRef } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { ChatappModule } from '../smartrotom/chatapp/chatapp.module';

@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
  imports: [forwardRef(() => ChatappModule)]
})
export class SocketsModule {}