import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  type DesktopTelemetryEventCode,
  type DesktopTelemetryEventName,
} from '@/_db/schema/DesktopTelemetry';
import { DesktopTelemetryEventDto } from './dto/desktop-telemetry.dto';
import { DesktopTelemetryRepository } from './repositories/desktop-telemetry.repository';

/**
 * Desktop telemetry service: opt-in, PII-scrubbed event collection.
 *
 * Rate-limiting: max 100 events per install_id per hour (avg ~1.67/min).
 * This prevents abuse while allowing normal operation (install, launch, crash
 * reporting, tool opens).
 *
 * Validation: all fields are enumerated and bounded. Non-enumerated codes are
 * rejected outright.
 */
@Injectable()
export class DesktopTelemetryService {
  private readonly MAX_EVENTS_PER_HOUR = 100;

  constructor(private readonly repository: DesktopTelemetryRepository) {}

  /**
   * Ingest a telemetry event. Validates the payload, enforces rate-limiting,
   * and stores only the event if all checks pass.
   *
   * Throws HttpException if:
   *   - install_id is not a valid UUID
   *   - event_name is not enumerated
   *   - code is not enumerated for this event type
   *   - install_id has exceeded the hourly rate limit
   *
   * Returns success only if the event was written to the database.
   */
  async ingestEvent(dto: DesktopTelemetryEventDto): Promise<void> {
    // Validate install_id format (UUID).
    if (!this.isValidUuid(dto.installId)) {
      throw new HttpException(
        'Invalid install_id: must be a valid UUID',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate event-specific code. (The DTO already validates enum membership,
    // but we add semantic validation here: certain codes only make sense with
    // certain event names.)
    if (
      !this.isValidCodeForEvent(
        dto.eventName,
        dto.code as DesktopTelemetryEventCode,
      )
    ) {
      throw new HttpException(
        `Invalid code "${dto.code}" for event type "${dto.eventName}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check rate limit: max MAX_EVENTS_PER_HOUR events per install_id per hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentCount = await this.repository.countEventsSince(
      dto.installId,
      oneHourAgo,
    );

    if (recentCount >= this.MAX_EVENTS_PER_HOUR) {
      throw new HttpException(
        'Rate limit exceeded: too many events from this installation',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Insert the event.
    await this.repository.insertEvent({
      installId: dto.installId,
      eventName: dto.eventName as DesktopTelemetryEventName,
      code: dto.code as DesktopTelemetryEventCode,
    });
  }

  /**
   * Validate UUID format. Desktop client generates UUIDs v4; a check here
   * filters out obvious garbage and prevents injection.
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate that a code is appropriate for the given event type.
   *
   * This is semantic validation beyond the enum check in the DTO. For example:
   *   - install-done accepts: success, failed
   *   - crash-code accepts: missing-dependency, loader-mismatch, etc. (CrashKind variants)
   *   - tool-open accepts: any tool id from the tool kit
   *   - launch accepts: launch (event itself is the fact)
   *
   * An event sent with the wrong code for its type is rejected.
   */
  private isValidCodeForEvent(
    eventName: DesktopTelemetryEventName,
    code: DesktopTelemetryEventCode,
  ): boolean {
    const validCodes: Record<DesktopTelemetryEventName, string[]> = {
      'install-done': ['success', 'failed'],
      launch: ['launch'],
      'crash-code': [
        'missing-dependency',
        'loader-mismatch',
        'mixin-failure',
        'out-of-memory',
        'wrong-java',
        'corrupt-mod-jar',
        'duplicate-mod',
        'unclassified',
      ],
      // tool-open accepts any tool id; we don't hardcode the list to avoid drift
      // The frontend validates the tool exists before sending
      'tool-open': [] as string[], // Will be bypassed below
    };

    // For tool-open, accept any non-empty code (will be one of the tool IDs)
    if (eventName === 'tool-open') {
      return code && typeof code === 'string' && code.length > 0;
    }

    return validCodes[eventName]?.includes(code as string) ?? false;
  }
}
