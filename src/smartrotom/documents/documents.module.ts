import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  providers: [DocumentsService, MySQL2Service],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
