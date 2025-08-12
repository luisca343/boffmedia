import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repositories and tokens
import { DocumentsRepository } from '@api/smartrotom/documents/repositories/documents.repository';
import { NewsRepository } from '@api/smartrotom/documents/repositories/news.repository';
import { DOCUMENTS_REPOSITORY_TOKEN, NEWS_REPOSITORY_TOKEN } from '@api/smartrotom/documents/repositories/interfaces/documents.repository.token';

// Import domain services
import { DocumentService } from './services/document.service';
import { NoteService } from './services/note.service';
import { NewsService } from './services/news.service';

// Import facade service
import { DocumentsFacadeService } from './documents.facade.service';

// Import controller
import { DocumentsController } from './documents.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [DocumentsController],
  providers: [
    // Provide repositories via tokens
    { provide: DOCUMENTS_REPOSITORY_TOKEN, useClass: DocumentsRepository },
    { provide: NEWS_REPOSITORY_TOKEN, useClass: NewsRepository },
    DocumentService,
    NoteService,
    NewsService,
    DocumentsFacadeService,
  ],
  exports: [
    DocumentsFacadeService,
    DocumentService,
    NoteService,
    NewsService,
  ],
})
export class DocumentsModule {}