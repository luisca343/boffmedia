import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsRepository } from './repositories/suggestions.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, SuggestionsRepository],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
