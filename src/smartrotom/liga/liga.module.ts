import { Module } from '@nestjs/common';
import { LigaController } from './liga.controller';
import { LigaService } from './liga.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [LigaController],
  providers: [LigaService, MySQL2Service],
})
export class LigaModule {}
