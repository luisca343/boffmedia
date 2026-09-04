import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  desktopTelemetryEvents,
  type DesktopTelemetryEventCode,
  type DesktopTelemetryEventName,
} from '@/_db/schema/DesktopTelemetry';

@Injectable()
export class DesktopTelemetryRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * COUNT, not the rows. The ingest endpoint is public and unauthenticated by
   * nature, so selecting every matching row to measure its length would make
   * flooding it cheaper for the attacker and more expensive for us with each
   * event they send — the rate limiter would become the amplifier.
   */
  async countEventsSince(installId: string, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(desktopTelemetryEvents)
      .where(
        and(
          eq(desktopTelemetryEvents.installId, installId),
          gt(desktopTelemetryEvents.createdAt, since),
        ),
      );
    return Number(row?.count ?? 0);
  }

  async insertEvent(event: {
    installId: string;
    eventName: DesktopTelemetryEventName;
    code: DesktopTelemetryEventCode;
  }): Promise<void> {
    await this.db.insert(desktopTelemetryEvents).values({
      installId: event.installId,
      eventName: event.eventName,
      code: event.code,
    });
  }
}
