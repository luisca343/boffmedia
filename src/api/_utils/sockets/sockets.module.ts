import { Module, forwardRef } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { MillionaireModule } from '@api/smartrotom/millionaire/millionaire.module';

@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
  imports: [
    forwardRef(() => ChatappModule),
    forwardRef(() => MillionaireModule)
  ]
})
export class SocketsModule {}