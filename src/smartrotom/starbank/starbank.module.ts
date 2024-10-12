import { Module } from '@nestjs/common';
import { StarbankController } from './starbank.controller';
import { StarbankService } from './starbank.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';


@Module({
    imports: [LoggerModule, ResponseModule],
    controllers: [StarbankController],
    providers: [StarbankService, MySQL2Service],
    exports: [StarbankService],
})

export class StarbankModule {}
