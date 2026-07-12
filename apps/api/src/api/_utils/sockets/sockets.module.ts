import { Module, forwardRef } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { PresenceModule } from './presence.module';

@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
  imports: [forwardRef(() => ChatappModule), PresenceModule],
})
export class SocketsModule {}
