import { Module } from '@nestjs/common';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repositories and tokens
import { DocumentsRepository } from '@api/smartrotom/documents/repositories/documents.repository';
import { NewsRepository } from '@api/smartrotom/documents/repositories/news.repository';
import { NoteOrganizationRepository } from '@api/smartrotom/documents/repositories/note-organization.repository';
import {
  DOCUMENTS_REPOSITORY_TOKEN,
  NEWS_REPOSITORY_TOKEN,
  NOTE_ORGANIZATION_REPOSITORY_TOKEN,
} from '@api/smartrotom/documents/repositories/interfaces/documents.repository.token';

// Import domain services
import { DocumentService } from './services/document.service';
import { NoteService } from './services/note.service';
import { NoteOrganizationService } from './services/note-organization.service';
import { NewsService } from './services/news.service';

// Import facade service
import { DocumentsFacadeService } from './documents.facade.service';

// Import controller
import { DocumentsController } from './documents.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [DocumentsController],
  providers: [
    RolesGuard,
    // Provide repositories via tokens
    { provide: DOCUMENTS_REPOSITORY_TOKEN, useClass: DocumentsRepository },
    { provide: NEWS_REPOSITORY_TOKEN, useClass: NewsRepository },
    {
      provide: NOTE_ORGANIZATION_REPOSITORY_TOKEN,
      useClass: NoteOrganizationRepository,
    },
    DocumentService,
    NoteService,
    NoteOrganizationService,
    NewsService,
    DocumentsFacadeService,
  ],
  exports: [
    DocumentsFacadeService,
    DocumentService,
    NoteService,
    NoteOrganizationService,
    NewsService,
  ],
})
export class DocumentsModule {}
