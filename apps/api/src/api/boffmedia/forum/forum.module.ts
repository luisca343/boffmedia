import { Module } from '@nestjs/common';
import { ResponseModule } from '@api/_utils/response/response.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { ForumController } from './forum.controller';

// Repositories
import { ForumCategoriesRepository } from './repositories/forum-categories.repository';
import { ForumThreadsRepository } from './repositories/forum-threads.repository';
import { ForumPostsRepository } from './repositories/forum-posts.repository';
import { ForumVotesRepository } from './repositories/forum-votes.repository';
import { ForumPresenceRepository } from './repositories/forum-presence.repository';

// Domain services
import { CategoriesService } from './services/categories.service';
import { ThreadsService } from './services/threads.service';
import { PostsService } from './services/posts.service';
import { PresenceService } from './services/presence.service';

// Facade service
import { ForumFacadeService } from './forum.facade.service';

@Module({
  providers: [
    // Repositories
    ForumCategoriesRepository,
    ForumThreadsRepository,
    ForumPostsRepository,
    ForumVotesRepository,
    ForumPresenceRepository,

    // Domain services
    CategoriesService,
    ThreadsService,
    PostsService,
    PresenceService,

    // Facade service
    ForumFacadeService,
  ],
  controllers: [ForumController],
  exports: [ForumFacadeService],
  imports: [ResponseModule, LoggerModule, DrizzleModule],
})
export class ForumModule {}
