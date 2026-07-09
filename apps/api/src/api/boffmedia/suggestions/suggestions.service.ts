import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEventSuggestions } from '@/_db/schema/Events';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { ReviewSuggestionDto } from './dto/review-suggestion.dto';
import { SuggestionEntity } from './entities/suggestion.entity';

@Injectable()
export class SuggestionsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private toEntity(
    row: typeof boffMediaEventSuggestions.$inferSelect,
  ): SuggestionEntity {
    return {
      id: row.id,
      proposerUserId: row.proposerUserId,
      title: row.title,
      gameName: row.gameName,
      type: row.type,
      description: row.description,
      additionalInfo: row.additionalInfo,
      suggestedDate: row.suggestedDate ? row.suggestedDate.toISOString() : null,
      endDate: row.endDate ? row.endDate.toISOString() : null,
      maxParticipants: row.maxParticipants,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  async create(
    dto: CreateSuggestionDto,
    proposerUserId: number | null,
  ): Promise<{ success: boolean; id: number }> {
    const result = await this.db
      .insert(boffMediaEventSuggestions)
      .values({
        proposerUserId,
        title: dto.title,
        gameName: dto.gameName,
        type: dto.type,
        description: dto.description,
        additionalInfo: dto.additionalInfo ?? null,
        suggestedDate: dto.suggestedDate ? new Date(dto.suggestedDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxParticipants: dto.maxParticipants ?? null,
      })
      .execute();

    return { success: true, id: result[0].insertId };
  }

  /** Admin: all suggestions, newest first. */
  async list(): Promise<SuggestionEntity[]> {
    const rows = await this.db
      .select()
      .from(boffMediaEventSuggestions)
      .orderBy(desc(boffMediaEventSuggestions.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  /** Admin: approve / reject a suggestion. */
  async review(id: number, dto: ReviewSuggestionDto): Promise<SuggestionEntity> {
    await this.db
      .update(boffMediaEventSuggestions)
      .set({ status: dto.status, reviewNote: dto.reviewNote ?? null })
      .where(eq(boffMediaEventSuggestions.id, id))
      .execute();

    const [row] = await this.db
      .select()
      .from(boffMediaEventSuggestions)
      .where(eq(boffMediaEventSuggestions.id, id));
    if (!row) throw new NotFoundException('Suggestion not found');
    return this.toEntity(row);
  }
}
