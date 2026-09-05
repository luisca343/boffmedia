import {
  char,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import {
  TELEMETRY_EVENT_NAMES,
  type DesktopTelemetryEventName,
  type DesktopTelemetryEventCode,
} from '@boffmedia/pack-schema';

// Re-export for use by services
export type { DesktopTelemetryEventName, DesktopTelemetryEventCode };

/**
 * Desktop telemetry events — opt-in, self-hosted, PII-scrubbed.
 *
 * Fields sent:
 *   - install_id: random per-install UUID (NOT tied to user, hardware, or account)
 *   - event_name: enumerated event type (install-done, launch, crash-code, tool-open)
 *   - code: enumerated outcome/detail code (success, failed, tool name, crash type)
 *   - created_at: server timestamp (when the event was recorded)
 *
 * NO personal data: no username, no email, no Minecraft UUID, no file paths,
 * no free-text crash messages. Every field is bounded and enumerated.
 *
 * Purpose: understand install success rates, launch frequency, crash patterns,
 * and tool usage without any ability to identify or track individuals.
 *
 * Access: only the desktop client and retention policies; no user-facing export.
 */
export const desktopTelemetryEvents = mysqlTable(
  'desktop_telemetry_events',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Random UUID, per-installation. NOT tied to user, machine, or account.
     *  Resets if the app's data directory is deleted. Used solely for rate-limiting
     *  and bucketing (e.g., install success rates across all installations). */
    installId: char('install_id', { length: 36 }).notNull(),
    /** Enumerated event name: install-done, launch, crash-code, tool-open. */
    eventName: mysqlEnum('event_name', TELEMETRY_EVENT_NAMES).notNull(),
    /** Enumerated event-specific code: success, failed, tool name, crash type.
     *  Bounded set, never open text. Validates on ingest. */
    code: varchar('code', { length: 32 }).notNull(),
    /** Server-side timestamp, set on insert. */
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    /** Rate-limiting index: enforce max events per install_id per time window. */
    installIdCreatedIdx: index('dtel_install_id_created_idx').on(
      table.installId,
      table.createdAt,
    ),
    /** Query index: recent events by type (for dashboards, analytics). */
    eventNameCreatedIdx: index('dtel_event_name_created_idx').on(
      table.eventName,
      table.createdAt,
    ),
  }),
);

export type DesktopTelemetryEvent = typeof desktopTelemetryEvents.$inferSelect;
export type NewDesktopTelemetryEvent =
  typeof desktopTelemetryEvents.$inferInsert;
