import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { SocketsGateway } from './sockets.gateway';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { PresenceModule } from './presence.module';

@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
  imports: [
    forwardRef(() => ChatappModule),
    PresenceModule,
    // Registered locally rather than importing AuthModule: AuthModule pulls in
    // the user/starbank graph, and this gateway only needs to VERIFY a token.
    // Same secret, so the two agree by construction.
    JwtModule.register({ secret: env.JWT_SECRET }),
  ],
})
export class SocketsModule {}
