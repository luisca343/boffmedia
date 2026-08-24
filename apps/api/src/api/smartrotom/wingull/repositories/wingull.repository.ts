import { WingullSQL2Service } from '@/_utils/WingullSQL2Service';
import { HttpException, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { throwIfDatabaseUnavailable } from '@api/_utils/database-availability';

@Injectable()
export class WingullRepository {
  constructor(
    private readonly logger: Logger,
    private readonly wingullSQL2Service: WingullSQL2Service,
  ) {}

  /**
   * The region catalog lives in the Teras database, which the mod owns and migrates. This side
   * reads it and never writes it.
   *
   * `type` is a stored column as of Teras schema v3. It used to be re-derived here by splitting
   * the region name on `__`, which was wrong twice over: a name without the separator silently
   * produced an empty type and vanished from every caller, and the same convention was being
   * re-implemented inside the mod, where it disagreed (a parcela is named
   * `pueblo_mizu__parcela_1`, so a `pueblo_` prefix test called it a town).
   *
   * `town` and `number` are deliberately NOT read from here. They belong to this application —
   * `rotom_gobierno_parcelas` holds them as real columns alongside zona, tax and status — and
   * Teras has no concept of a town.
   */
  private static readonly OWNABLE_TYPES = ['parcela', 'tienda'] as const;

  /**
   * Every ownable region with its current owner, or `null` where nobody owns it yet.
   *
   * A LEFT JOIN, because an unsold parcela still has to appear: urbanismo lists it as
   * `sin_registrar` and the census must not count it for anyone. Non-ownable regions — towns,
   * roads, public spaces — are excluded in SQL rather than filtered by the caller, so a `null`
   * owner has exactly one meaning here.
   */
  async getAllPlots(): Promise<
    {
      regionId: string;
      type: string;
      ownerUuid?: string;
      ownedSince?: number;
    }[]
  > {
    try {
      const placeholders = WingullRepository.OWNABLE_TYPES.map(() => '?').join(', ');
      const query = `
        SELECT r.name AS regionId, r.type, p.owner_uuid AS ownerUuid, p.owned_since AS ownedSince
        FROM teras_region r
        LEFT JOIN teras_plot p ON p.region_name = r.name
        WHERE r.type IN (${placeholders})
      `;
      const [rows] = await this.wingullSQL2Service.query(query, [
        ...WingullRepository.OWNABLE_TYPES,
      ]);

      return (
        rows as {
          regionId: string;
          type: string;
          ownerUuid: string | null;
          ownedSince: number | null;
        }[]
      ).map((row) => ({
        // The exact region identifier — the join key `rotom_gobierno_parcelas.region_id` keys
        // off. Never rebuild it from its parts: zero-padding would not round-trip.
        regionId: row.regionId,
        type: row.type,
        ownerUuid: row.ownerUuid ?? undefined,
        ownedSince: row.ownedSince ?? undefined,
      }));
    } catch (error: any) {
      this.logger.error('Error fetching all plots:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throwIfDatabaseUnavailable(error);
      throw new Error('Failed to fetch all plots');
    }
  }

  /**
   * What one player owns. The caller already knows the uuid it asked about, so this returns the
   * regions themselves rather than re-reporting the player — the old WorldGuard query joined a
   * user table to hand back the name and a numeric world id, neither of which exists in Teras.
   */
  async getPlayersOwnedRegions(uuid: string): Promise<
    {
      regionId: string;
      type: string;
      dimension: string;
      ownedSince?: number;
    }[]
  > {
    try {
      const query = `
        SELECT p.region_name AS regionId, r.type, r.dimension, p.owned_since AS ownedSince
        FROM teras_plot p
        JOIN teras_region r ON r.name = p.region_name
        WHERE p.owner_uuid = ?
      `;
      const [rows] = await this.wingullSQL2Service.query(query, [uuid]);

      return (
        rows as {
          regionId: string;
          type: string;
          dimension: string;
          ownedSince: number | null;
        }[]
      ).map((row) => ({
        regionId: row.regionId,
        type: row.type,
        dimension: row.dimension,
        ownedSince: row.ownedSince ?? undefined,
      }));
    } catch (error: any) {
      this.logger.error('Error fetching players owned regions:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throwIfDatabaseUnavailable(error);
      throw new Error('Failed to fetch players owned regions');
    }
  }
}
