import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeService } from './arcade.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
    imports: [LoggerModule, ResponseModule, DrizzleModule],
    controllers: [ArcadeController],
    providers: [ArcadeService],

})
export class ArcadeModule {}
