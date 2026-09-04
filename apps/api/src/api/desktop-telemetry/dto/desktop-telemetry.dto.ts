import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import {
  TELEMETRY_EVENT_NAMES,
  type DesktopTelemetryEventName,
} from '@boffmedia/pack-schema';

/**
 * Desktop telemetry event ingest DTO.
 *
 * Fields are enumerated and bounded — NO personal data is accepted.
 * The API validates and rejects any malformed or oversized payload.
 * The `code` field is validated semantically in the service:
 * - install-done, launch, crash-code have defined code sets
 * - tool-open accepts any non-empty string (tool id from the registry)
 */
export class DesktopTelemetryEventDto {
  /** Random per-installation UUID (NOT user/hardware/account-linked). */
  @IsString()
  @IsNotEmpty()
  installId: string;

  /** Enumerated event name: install-done, launch, crash-code, tool-open. */
  @IsEnum(TELEMETRY_EVENT_NAMES)
  eventName: DesktopTelemetryEventName;

  /** Event-specific code: enum for most events, free string (tool id) for tool-open.
   *  Validated semantically in the service. */
  @IsString()
  @IsNotEmpty()
  code: string;
}
