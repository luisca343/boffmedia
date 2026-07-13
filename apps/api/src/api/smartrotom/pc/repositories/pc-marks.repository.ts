import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { RotomPcMark, rotomPcMarks } from '@/_db/schema/SmartRotomPc';
import { PcMark } from '../entities/pc-mark.entity';
import {
  IPcMarksRepository,
  PcMarkWrite,
} from './interfaces/pc-marks.repository.interface';

@Injectable()
export class PcMarksRepository implements IPcMarksRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // MariaDB stores JSON as LONGTEXT, so the driver can hand back a raw string
  // instead of a parsed array — normalise both shapes.
  private parseTags(value: RotomPcMark['tags']): string[] {
    if (Array.isArray(value)) return value.filter((t) => typeof t === 'string');
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((t): t is string => typeof t === 'string')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toEntity(row: RotomPcMark): PcMark {
    return {
      id: row.id,
      uuid: row.userUuid,
      pokemonKey: row.pokemonKey,
      favorite: Boolean(row.favorite),
      tags: this.parseTags(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByUser(uuid: string): Promise<PcMark[]> {
    const rows = await this.db
      .select()
      .from(rotomPcMarks)
      .where(eq(rotomPcMarks.userUuid, uuid));
    return rows.map((row) => this.toEntity(row));
  }

  async findByKeys(uuid: string, pokemonKeys: string[]): Promise<PcMark[]> {
    if (pokemonKeys.length === 0) return [];
    const rows = await this.db
      .select()
      .from(rotomPcMarks)
      .where(
        and(
          eq(rotomPcMarks.userUuid, uuid),
          inArray(rotomPcMarks.pokemonKey, pokemonKeys),
        ),
      );
    return rows.map((row) => this.toEntity(row));
  }

  async findOne(uuid: string, pokemonKey: string): Promise<PcMark | null> {
    const rows = await this.db
      .select()
      .from(rotomPcMarks)
      .where(
        and(
          eq(rotomPcMarks.userUuid, uuid),
          eq(rotomPcMarks.pokemonKey, pokemonKey),
        ),
      )
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async upsert(
    uuid: string,
    pokemonKey: string,
    data: PcMarkWrite,
  ): Promise<PcMark> {
    const [result] = await this.upsertMany(uuid, [{ pokemonKey, ...data }]);
    return result;
  }

  // Relies on the (user_uuid, pokemon_key) UNIQUE index: concurrent writers can
  // never create a duplicate row for the same Pokémon.
  async upsertMany(
    uuid: string,
    rows: { pokemonKey: string; favorite: boolean; tags: string[] }[],
  ): Promise<PcMark[]> {
    if (rows.length === 0) return [];

    const now = new Date();
    for (const row of rows) {
      await this.db
        .insert(rotomPcMarks)
        .values({
          userUuid: uuid,
          pokemonKey: row.pokemonKey,
          favorite: row.favorite,
          tags: row.tags,
          createdAt: now,
          updatedAt: now,
        })
        .onDuplicateKeyUpdate({
          set: {
            favorite: row.favorite,
            tags: row.tags,
            updatedAt: now,
          },
        });
    }

    return this.findByKeys(
      uuid,
      rows.map((row) => row.pokemonKey),
    );
  }
}
