import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { DesktopTelemetryService } from './desktop-telemetry.service';
import { DesktopTelemetryEventDto } from './dto/desktop-telemetry.dto';

/**
 * Desktop telemetry ingest endpoint.
 *
 * PUBLIC and UNAUTHENTICATED by design — the client opts in locally and may
 * send events before authenticating with Boffmedia. The endpoint is rate-limited
 * per install_id and validates all payloads strictly to prevent abuse.
 *
 * Every event carries ZERO personal data:
 *   - install_id: random per-installation UUID (not user/hardware/account-linked)
 *   - event_name: enumerated (install-done, launch, crash-code, tool-open)
 *   - code: enumerated (success, failed, tool name, crash classification)
 *   - created_at: server timestamp (set on ingest)
 *
 * Non-enumerated events, malformed UUIDs, and oversized payloads are rejected.
 * Rejected requests return 400 (bad request) or 429 (rate limited), never 401/403.
 */
@ApiTags('Desktop | Telemetry')
@Controller('desktop/telemetry')
export class DesktopTelemetryController {
  constructor(private readonly telemetry: DesktopTelemetryService) {}

  /**
   * Ingest a desktop telemetry event.
   *
   * POST /desktop/telemetry
   * Body:
   * {
   *   "installId": "550e8400-e29b-41d4-a716-446655440000",
   *   "eventName": "install-done",
   *   "code": "success"
   * }
   *
   * Response: 204 No Content (success), no body.
   * Errors: 400 (malformed), 429 (rate limited).
   */
  @Post()
  @Public()
  @SkipEnvelope()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Enviar un evento de telemetría',
    description:
      'Registra un evento anónimo de telemetría. Sin autenticación requerida. Sin cuerpo en la respuesta, solo estado HTTP.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Evento registrado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Evento malformado (UUID inválido, campo faltante, tipo no enumerado)',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Límite de eventos superado para esta instalación (100/hora)',
  })
  async ingestEvent(@Body() dto: DesktopTelemetryEventDto): Promise<void> {
    await this.telemetry.ingestEvent(dto);
  }
}
