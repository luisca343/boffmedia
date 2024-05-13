import { Module, forwardRef } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { ChatappModule } from '../chatapp/chatapp.module';

@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
  imports: [forwardRef(() => ChatappModule)]
})
export class SocketsModule {}