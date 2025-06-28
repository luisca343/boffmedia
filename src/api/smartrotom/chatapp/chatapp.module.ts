import { Module, forwardRef } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import new repositories
import { ChatRepository } from './repositories/chat.repository';
import { ChatMemberRepository } from './repositories/chat-member.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatUserRepository } from './repositories/chat-user.repository';
// Import tokens
import { CHAT_REPOSITORY_TOKEN, CHAT_MEMBER_REPOSITORY_TOKEN, CHAT_MESSAGE_REPOSITORY_TOKEN, CHAT_USER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/chatapp.repository.token';

// Import domain services
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { GroupService } from './services/group.service';
import { CallService } from './services/call.service';

// Import facade service
import { ChatappFacadeService } from './chatapp.facade.service';

// Import controller
import { ChatappController } from './chatapp.controller';
import { SocketsModule } from '@api/_utils/sockets/sockets.module';

@Module({
  imports: [
    forwardRef(() => SocketsModule),
    ResponseModule,
    LoggerModule,
    DrizzleModule
  ],
  controllers: [ChatappController],
  providers: [
    // Repositories with tokens
    {
      provide: CHAT_REPOSITORY_TOKEN,
      useClass: ChatRepository,
    },
    {
      provide: CHAT_MEMBER_REPOSITORY_TOKEN,
      useClass: ChatMemberRepository,
    },
    {
      provide: CHAT_MESSAGE_REPOSITORY_TOKEN,
      useClass: ChatMessageRepository,
    },
    {
      provide: CHAT_USER_REPOSITORY_TOKEN,
      useClass: ChatUserRepository,
    },
    // Domain services
    ChatService,
    MessageService,
    GroupService,
    CallService,
    // Facade service
    ChatappFacadeService,
  ],
  exports: [
    // Export facade service as the main interface
    ChatappFacadeService,
    // Also export individual services for use by other modules if needed
    ChatService,
    MessageService,
    GroupService,
    CallService,
    // Export tokens for DI in other modules
    CHAT_REPOSITORY_TOKEN,
    CHAT_MEMBER_REPOSITORY_TOKEN,
    CHAT_MESSAGE_REPOSITORY_TOKEN,
    CHAT_USER_REPOSITORY_TOKEN,
  ],
})
export class ChatappModule {}