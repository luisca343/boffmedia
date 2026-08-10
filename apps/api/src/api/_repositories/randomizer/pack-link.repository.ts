import { Inject, Injectable, Logger, Module } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE, DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { EVENT_STATUS, boffMediaEvents } from '@/_db/schema/BoffMediaEvents';
import { RandomizerConfig, randomizerConfigs } from '@/_db/schema/Randomizer';

/**
 * The one query that resolves a pack to its randomizer config.
 *
 * It used to exist twice — once in PacksRepository, once in
 * RandomizerRepository — because RandomizerModule imports PacksModule, so
 * PacksModule cannot import RandomizerModule. Two copies of the query that
 * gates the anti-cheat clean-ROM check is one copy too many, so it lives in its
 * own tiny module that both sides import instead.
 */
@Injectable()
export class RandomizerPackLinkRepository {
  private readonly logger = new Logger(RandomizerPackLinkRepository.name);

  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  /**
   * The config of the event that has this pack attached, or null. By default
   * only an ACTIVE event matches (the mint path's contract). With
   * `anyEventStatus` any non-deleted event matches: the manifest's anti-cheat
   * injection must survive a normal active→completed lifecycle flip, or the
   * pack stays installable with no clean-ROM gate at all.
   * Config-status gating (open/closed/published) is the caller's job.
   *
   * A failure returns null rather than throwing, so a database hiccup cannot
   * block manifest serving — but it is logged at error level, because a silent
   * null here means the manifest ships WITHOUT the randomizer block and the
   * launcher's clean-ROM gate quietly stops applying.
   */
  async findByPackId(
    packId: string,
    opts?: { anyEventStatus?: boolean },
  ): Promise<RandomizerConfig | null> {
    if (!packId) return null;

    try {
      const rows = await this.db
        .select({ config: randomizerConfigs })
        .from(boffMediaEvents)
        .innerJoin(
          randomizerConfigs,
          eq(randomizerConfigs.eventId, boffMediaEvents.id),
        )
        .where(
          and(
            eq(boffMediaEvents.packId, packId),
            opts?.anyEventStatus
              ? isNull(boffMediaEvents.deletedAt)
              : eq(boffMediaEvents.status, EVENT_STATUS.ACTIVE),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0].config : null;
    } catch (error) {
      this.logger.error(
        `Randomizer link lookup FAILED for pack ${packId} — the manifest will ship without its randomizer block, which disables the clean-ROM gate: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
  }
}

@Module({
  imports: [DrizzleModule],
  providers: [RandomizerPackLinkRepository],
  exports: [RandomizerPackLinkRepository],
})
export class RandomizerPackLinkModule {}
