import { Module, forwardRef } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repository
import { ChatappRepository } from '@api/smartrotom/chatapp/repositories/chatapp.repository';

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
    // Repository
    ChatappRepository,
    
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
  ],
})
export class ChatappModule {}