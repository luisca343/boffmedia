import { Module, forwardRef } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ChatappController } from './chatapp.controller';
import { SocketsModule } from '../../_utils/sockets/sockets.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
    providers: [ChatappService],
    controllers: [ChatappController],
    exports: [ChatappService],
    imports: [forwardRef(() => SocketsModule), ResponseModule, LoggerModule, DrizzleModule],
  })
export class ChatappModule {}
