import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEventSuggestions } from '@/_db/schema/BoffMediaEvents';

export type SuggestionRow = typeof boffMediaEventSuggestions.$inferSelect;
export type NewSuggestion = typeof boffMediaEventSuggestions.$inferInsert;

@Injectable()
export class SuggestionsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async insert(values: NewSuggestion): Promise<number> {
    const result = await this.db
      .insert(boffMediaEventSuggestions)
      .values(values)
      .execute();
    return result[0].insertId;
  }

  /** Newest first. */
  async findAll(): Promise<SuggestionRow[]> {
    return this.db
      .select()
      .from(boffMediaEventSuggestions)
      .orderBy(desc(boffMediaEventSuggestions.createdAt));
  }

  async findById(id: number): Promise<SuggestionRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaEventSuggestions)
      .where(eq(boffMediaEventSuggestions.id, id));
    return row ?? null;
  }

  async setReview(
    id: number,
    // The column is an enum, so the narrow type is deliberate: a plain `string`
    // here would let a typo reach the database as a silent no-op update.
    status: SuggestionRow['status'],
    reviewNote: string | null,
  ): Promise<void> {
    await this.db
      .update(boffMediaEventSuggestions)
      .set({ status, reviewNote })
      .where(eq(boffMediaEventSuggestions.id, id))
      .execute();
  }
}
