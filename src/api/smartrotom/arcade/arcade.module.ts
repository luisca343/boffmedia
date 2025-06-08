import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeService } from './arcade.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '../starbank/starbank.module';
import { WingullModule } from '../wingull/wingull.module';

@Module({
    imports: [LoggerModule, ResponseModule, DrizzleModule, StarbankModule, WingullModule],
    controllers: [ArcadeController],
    providers: [ArcadeService],
})
export class ArcadeModule {}