import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { ReviewSuggestionDto } from './dto/review-suggestion.dto';
import { SuggestionEntity } from './entities/suggestion.entity';
import {
  SuggestionRow,
  SuggestionsRepository,
} from './repositories/suggestions.repository';

@Injectable()
export class SuggestionsService {
  constructor(private readonly repo: SuggestionsRepository) {}

  private toEntity(row: SuggestionRow): SuggestionEntity {
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
    const id = await this.repo.insert({
      proposerUserId,
      title: dto.title,
      gameName: dto.gameName,
      type: dto.type,
      description: dto.description,
      additionalInfo: dto.additionalInfo ?? null,
      suggestedDate: dto.suggestedDate ? new Date(dto.suggestedDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxParticipants: dto.maxParticipants ?? null,
    });

    return { success: true, id };
  }

  /** Admin: all suggestions, newest first. */
  async list(): Promise<SuggestionEntity[]> {
    const rows = await this.repo.findAll();
    return rows.map((r) => this.toEntity(r));
  }

  /** Admin: approve / reject a suggestion. */
  async review(
    id: number,
    dto: ReviewSuggestionDto,
  ): Promise<SuggestionEntity> {
    await this.repo.setReview(id, dto.status, dto.reviewNote ?? null);

    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Suggestion not found');
    return this.toEntity(row);
  }
}
