import { HttpException, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  PokedexRegistry,
  pokedexRegistry,
} from '@/_db/schema/SmartRotomPokedex';
import { eq, and, desc } from 'drizzle-orm';
import { IPokemonRepository } from './interfaces/pokemon.repository.interface';
import { Logger } from 'nestjs-pino';

export interface PokedexRegistryData {
  uuid: string;
  pokemonId: number;
  formId: string;
  paletteId: string;
  seenAt?: Date;
  caughtAt?: Date;
}

export interface PokedexRegistryResult {
  pokemonId: number;
  formId: string;
  paletteId: string;
  seenAt: Date | null;
  caughtAt: Date | null;
}

export interface PokedexStatistics {
  seenPokemon: number;
  caughtPokemon: number;
  totalPokemon: number;
  missingPokemon: number;
  missingCaughtPokemon: number;
  shinyPokemon: number;
}

export interface DetailedPokedexStatistics {
  seenPokemon: string[];
  caughtPokemon: string[];
  shinyPokemon: string[];
  totalPokemon: number;
  totalForms: number;
  seenCount: number;
  caughtCount: number;
  shinyCount: number;
  missingSeenPokemon: number;
  missingCaughtPokemon: number;
  missingSeenForms: number;
  missingCaughtForms: number;
}

export interface BulkUpdateData {
  SEEN: number[];
  CAUGHT: number[];
}

export interface BulkUpdateResult {
  inserted: { seen: number; caught: number };
  updated: number;
  total: number;
}

@Injectable()
export class PokemonRepository implements IPokemonRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== POKEDEX REGISTRY OPERATIONS ====================

  async createPokedexRegistry(
    data: PokedexRegistryData,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.db
        .insert(pokedexRegistry)
        .values({
          uuid: data.uuid,
          pokemonId: data.pokemonId,
          formId: data.formId,
          paletteId: data.paletteId,
          seenAt: data.seenAt || new Date(),
          caughtAt: data.caughtAt || null,
        } as PokedexRegistry)
        .execute();

      if (result[0].affectedRows === 1) {
        return { success: true };
      }

      return { success: false, message: 'Failed to create registry entry' };
    } catch (error: any) {
      this.logger.error('Failed to create pokedex registry:', error);
      return {
        success: false,
        message: `Registry creation failed: ${error.message}`,
      };
    }
  }

  async findPokedexRegistry(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
  ): Promise<PokedexRegistryResult | null> {
    try {
      const result = await this.db
        .select({
          pokemonId: pokedexRegistry.pokemonId,
          formId: pokedexRegistry.formId,
          paletteId: pokedexRegistry.paletteId,
          seenAt: pokedexRegistry.seenAt,
          caughtAt: pokedexRegistry.caughtAt,
        })
        .from(pokedexRegistry)
        .where(
          and(
            eq(pokedexRegistry.uuid, uuid),
            eq(pokedexRegistry.pokemonId, pokemonId),
            eq(pokedexRegistry.formId, formId),
            eq(pokedexRegistry.paletteId, paletteId),
          ),
        )
        .execute();

      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      this.logger.error('Failed to find pokedex registry:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Registry lookup failed: ${error.message}`);
    }
  }

  async updatePokedexRegistry(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
    updateData: Partial<PokedexRegistryData>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.db
        .update(pokedexRegistry)
        .set(updateData as PokedexRegistry)
        .where(
          and(
            eq(pokedexRegistry.uuid, uuid),
            eq(pokedexRegistry.pokemonId, pokemonId),
            eq(pokedexRegistry.formId, formId),
            eq(pokedexRegistry.paletteId, paletteId),
          ),
        )
        .execute();

      if (result[0].affectedRows === 1) {
        return { success: true };
      }

      return { success: false, message: 'No registry found to update' };
    } catch (error: any) {
      this.logger.error('Failed to update pokedex registry:', error);
      return {
        success: false,
        message: `Registry update failed: ${error.message}`,
      };
    }
  }

  async getUserPokedexRegistries(
    uuid: string,
    limit: number = 20,
  ): Promise<PokedexRegistryResult[]> {
    try {
      return await this.db
        .select({
          pokemonId: pokedexRegistry.pokemonId,
          formId: pokedexRegistry.formId,
          paletteId: pokedexRegistry.paletteId,
          seenAt: pokedexRegistry.seenAt,
          caughtAt: pokedexRegistry.caughtAt,
        })
        .from(pokedexRegistry)
        .where(eq(pokedexRegistry.uuid, uuid))
        .orderBy(desc(pokedexRegistry.id))
        .limit(limit)
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to get registries for user ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`User registries retrieval failed: ${error.message}`);
    }
  }

  async getAllUserPokedexRegistries(
    uuid: string,
  ): Promise<PokedexRegistryResult[]> {
    try {
      return await this.db
        .selectDistinct({
          pokemonId: pokedexRegistry.pokemonId,
          formId: pokedexRegistry.formId,
          paletteId: pokedexRegistry.paletteId,
          seenAt: pokedexRegistry.seenAt,
          caughtAt: pokedexRegistry.caughtAt,
        })
        .from(pokedexRegistry)
        .where(eq(pokedexRegistry.uuid, uuid))
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to get all registries for user ${uuid}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`All user registries retrieval failed: ${error.message}`);
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkInsertPokedexRegistries(
    registries: PokedexRegistryData[],
  ): Promise<{ success: boolean; insertedCount: number }> {
    if (registries.length === 0) {
      return { success: true, insertedCount: 0 };
    }

    try {
      const result = await this.db
        .insert(pokedexRegistry)
        .values(
          registries.map(
            (registry) =>
              ({
                uuid: registry.uuid,
                pokemonId: registry.pokemonId,
                formId: registry.formId,
                paletteId: registry.paletteId,
                seenAt: registry.seenAt || new Date(),
                caughtAt: registry.caughtAt || null,
              }) as PokedexRegistry,
          ),
        )
        .execute();

      return {
        success: true,
        insertedCount: result[0].affectedRows || 0,
      };
    } catch (error: any) {
      this.logger.error('Failed to bulk insert pokedex registries:', error);
      return { success: false, insertedCount: 0 };
    }
  }

  async bulkUpdatePokedexRegistriesStatus(
    uuid: string,
    pokemonIds: number[],
    status: 'seen' | 'caught',
  ): Promise<{ success: boolean; updatedCount: number }> {
    if (pokemonIds.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    try {
      let updatedCount = 0;

      // Process in batches to avoid query size limits
      const batchSize = 50;
      for (let i = 0; i < pokemonIds.length; i += batchSize) {
        const batch = pokemonIds.slice(i, i + batchSize);

        for (const pokemonId of batch) {
          const updateData =
            status === 'caught' ? { caughtAt: new Date() } : {};

          const result = await this.db
            .update(pokedexRegistry)
            .set(updateData as PokedexRegistry)
            .where(
              and(
                eq(pokedexRegistry.uuid, uuid),
                eq(pokedexRegistry.pokemonId, pokemonId),
                eq(pokedexRegistry.formId, 'base'),
                eq(pokedexRegistry.paletteId, 'none'),
              ),
            )
            .execute();

          updatedCount += result[0].affectedRows || 0;
        }
      }

      return { success: true, updatedCount };
    } catch (error: any) {
      this.logger.error('Failed to bulk update pokedex registries:', error);
      return { success: false, updatedCount: 0 };
    }
  }

  // ==================== STATISTICS ====================

  async getPokedexStatistics(
    uuid: string,
    totalPokemonCount: number,
  ): Promise<PokedexStatistics> {
    try {
      const registries = await this.getAllUserPokedexRegistries(uuid);

      const seenUniquePokemonIds = new Set(
        registries.filter((p) => p.seenAt !== null).map((p) => p.pokemonId),
      );
      const caughtUniquePokemonIds = new Set(
        registries.filter((p) => p.caughtAt !== null).map((p) => p.pokemonId),
      );

      const seenPokemon = seenUniquePokemonIds.size;
      const caughtPokemon = caughtUniquePokemonIds.size;
      const shinyPokemon = registries.filter(
        (p) => p.paletteId === 'shiny' && p.caughtAt !== null,
      ).length;

      return {
        seenPokemon,
        caughtPokemon,
        totalPokemon: totalPokemonCount,
        missingPokemon: totalPokemonCount - seenPokemon,
        missingCaughtPokemon: totalPokemonCount - caughtPokemon,
        shinyPokemon,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get pokedex statistics for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Pokedex statistics retrieval failed: ${error.message}`);
    }
  }

  // ==================== CACHE SUPPORT ====================

  async getUserRegistriesForCache(
    uuid: string,
  ): Promise<PokedexRegistryResult[]> {
    try {
      return await this.db
        .select({
          pokemonId: pokedexRegistry.pokemonId,
          formId: pokedexRegistry.formId,
          paletteId: pokedexRegistry.paletteId,
          seenAt: pokedexRegistry.seenAt,
          caughtAt: pokedexRegistry.caughtAt,
        })
        .from(pokedexRegistry)
        .where(eq(pokedexRegistry.uuid, uuid))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to get registries for cache ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Cache registries retrieval failed: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  async checkRegistryExists(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
  ): Promise<boolean> {
    try {
      const registry = await this.findPokedexRegistry(
        uuid,
        pokemonId,
        formId,
        paletteId,
      );
      return !!registry;
    } catch (error: any) {
      this.logger.error('Failed to check registry existence:', error);
      return false;
    }
  }

  async getRegistryCount(uuid: string): Promise<number> {
    try {
      const registries = await this.getAllUserPokedexRegistries(uuid);
      return registries.length;
    } catch (error: any) {
      this.logger.error(`Failed to get registry count for ${uuid}:`, error);
      return 0;
    }
  }
}
