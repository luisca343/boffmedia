import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcSmogonSnapshots,
  vgcSmogonPokemon,
  VgcSmogonSnapshot,
  VgcSmogonPokemon,
} from '@/_db/schema/Vgc';

type PokemonInsert = typeof vgcSmogonPokemon.$inferInsert;

@Injectable()
export class SmogonRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ─── Snapshots ──────────────────────────────────────────────────────────────

  async findAvailableSnapshots(): Promise<VgcSmogonSnapshot[]> {
    return this.db
      .select()
      .from(vgcSmogonSnapshots)
      .orderBy(desc(vgcSmogonSnapshots.fetchedAt));
  }

  async findSnapshot(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<VgcSmogonSnapshot | null> {
    const [row] = await this.db
      .select()
      .from(vgcSmogonSnapshots)
      .where(
        and(
          eq(vgcSmogonSnapshots.formatId, formatId),
          eq(vgcSmogonSnapshots.month, month),
          eq(vgcSmogonSnapshots.cutoff, cutoff),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async upsertSnapshot(data: {
    formatId: string;
    month: string;
    cutoff: number;
    pokemonCount: number;
  }): Promise<void> {
    const now = new Date();
    await this.db
      .insert(vgcSmogonSnapshots)
      .values({ ...data, fetchedAt: now })
      .onDuplicateKeyUpdate({
        set: { pokemonCount: data.pokemonCount, fetchedAt: now },
      });
  }

  // ─── Pokémon rows ─────────────────────────────────────────────────────────

  async deleteSnapshot(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<void> {
    await this.db
      .delete(vgcSmogonSnapshots)
      .where(
        and(
          eq(vgcSmogonSnapshots.formatId, formatId),
          eq(vgcSmogonSnapshots.month, month),
          eq(vgcSmogonSnapshots.cutoff, cutoff),
        ),
      );
  }

  async deletePokemon(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<void> {
    await this.db
      .delete(vgcSmogonPokemon)
      .where(
        and(
          eq(vgcSmogonPokemon.formatId, formatId),
          eq(vgcSmogonPokemon.month, month),
          eq(vgcSmogonPokemon.cutoff, cutoff),
        ),
      );
  }

  async insertPokemonBatch(rows: PokemonInsert[]): Promise<void> {
    for (let i = 0; i < rows.length; i += 100) {
      await this.db.insert(vgcSmogonPokemon).values(rows.slice(i, i + 100));
    }
  }

  async findAllPokemon(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<VgcSmogonPokemon[]> {
    return this.db
      .select()
      .from(vgcSmogonPokemon)
      .where(
        and(
          eq(vgcSmogonPokemon.formatId, formatId),
          eq(vgcSmogonPokemon.month, month),
          eq(vgcSmogonPokemon.cutoff, cutoff),
        ),
      )
      .orderBy(vgcSmogonPokemon.rank);
  }

  async findPokemon(
    formatId: string,
    month: string,
    cutoff: number,
    speciesId: string,
  ): Promise<VgcSmogonPokemon | null> {
    const [row] = await this.db
      .select()
      .from(vgcSmogonPokemon)
      .where(
        and(
          eq(vgcSmogonPokemon.formatId, formatId),
          eq(vgcSmogonPokemon.month, month),
          eq(vgcSmogonPokemon.cutoff, cutoff),
          eq(vgcSmogonPokemon.speciesId, speciesId),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}
