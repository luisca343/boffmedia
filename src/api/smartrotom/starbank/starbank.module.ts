import { Module } from '@nestjs/common';
import { StarbankController } from './starbank.controller';
import { StarbankService } from './starbank.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';


@Module({
    imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
    controllers: [StarbankController],
    providers: [StarbankService],
    exports: [StarbankService],
})

export class StarbankModule {}
