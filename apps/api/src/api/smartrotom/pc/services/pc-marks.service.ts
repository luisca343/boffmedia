import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PC_MARKS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IPcMarksRepository } from '../repositories/interfaces/pc-marks.repository.interface';
import { PcMark } from '../entities/pc-mark.entity';
import { BulkUpsertPcMarksDto, UpsertPcMarkDto } from '../dto/pc-mark.dto';

@Injectable()
export class PcMarksService {
  constructor(
    @Inject(PC_MARKS_REPOSITORY_TOKEN)
    private readonly pcMarksRepository: IPcMarksRepository,
  ) {}

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private normalizeTags(tags: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const tag of tags) {
      const trimmed = tag.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
    return result;
  }

  private applyTagDelta(
    current: string[],
    addTags?: string[],
    removeTags?: string[],
  ): string[] {
    const removed = new Set(
      this.normalizeTags(removeTags ?? []).map((t) => t.toLowerCase()),
    );
    const merged = this.normalizeTags([...current, ...(addTags ?? [])]);
    return merged.filter((tag) => !removed.has(tag.toLowerCase()));
  }

  async getMarks(uuid: string): Promise<PcMark[]> {
    this.validateUuid(uuid);
    return this.pcMarksRepository.findByUser(uuid);
  }

  // Upsert one mark: create when absent, patch only the provided fields when
  // present. `ownerUuid` is the authenticated caller, never a body field.
  async upsertMark(ownerUuid: string, data: UpsertPcMarkDto): Promise<PcMark> {
    this.validateUuid(ownerUuid);
    if (!data.pokemonKey) {
      throw new BadRequestException('pokemonKey is required');
    }

    const existing = await this.pcMarksRepository.findOne(
      ownerUuid,
      data.pokemonKey,
    );

    return this.pcMarksRepository.upsert(ownerUuid, data.pokemonKey, {
      favorite: data.favorite ?? existing?.favorite ?? false,
      tags: data.tags ? this.normalizeTags(data.tags) : (existing?.tags ?? []),
    });
  }

  // Upsert many marks at once (bulk-select bar): same favourite flag for every
  // key, plus an additive/subtractive tag delta applied per key.
  async bulkUpsert(
    ownerUuid: string,
    data: BulkUpsertPcMarksDto,
  ): Promise<PcMark[]> {
    this.validateUuid(ownerUuid);

    const keys = this.normalizeTags(data.pokemonKeys ?? []);
    if (keys.length === 0) return [];

    const existing = await this.pcMarksRepository.findByKeys(ownerUuid, keys);
    const byKey = new Map(existing.map((mark) => [mark.pokemonKey, mark]));

    const rows = keys.map((pokemonKey) => {
      const current = byKey.get(pokemonKey);
      return {
        pokemonKey,
        favorite: data.favorite ?? current?.favorite ?? false,
        tags: this.applyTagDelta(
          current?.tags ?? [],
          data.addTags,
          data.removeTags,
        ),
      };
    });

    return this.pcMarksRepository.upsertMany(ownerUuid, rows);
  }
}
