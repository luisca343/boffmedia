import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResendWebhookService } from './resend-webhook.service';

/**
 * Resend webhook endpoint. Receives signed events from Resend's transactional
 * mail service and processes bounce/complaint notifications.
 *
 * Security:
 * - All requests must include x-resend-signature header
 * - Signature = HMAC-SHA256(body, RESEND_WEBHOOK_SECRET) in base64
 * - Unverified payloads are rejected with 401
 * - Never fail transactional sends due to webhook errors
 *
 * The signature is checked against `req.rawBody` (main.ts enables `rawBody`),
 * never against a re-serialised body: an HMAC covers the bytes the sender
 * transmitted, and JSON.stringify of the parsed object does not reproduce them.
 *
 * Hops:
 * Resend → POST /webhooks/resend → verify signature → update user.email_bounced → 200 OK
 */
@ApiTags('Webhooks')
@Public()
@Controller('webhooks/resend')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);

  constructor(private readonly resendService: ResendWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive Resend webhook events',
    description:
      'Receives signed webhook events from Resend (bounces, complaints, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid webhook signature',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-resend-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    // The bytes Resend actually sent. Verifying a re-serialised body would
    // fail on every real delivery while passing any test that re-serialises
    // the same way.
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error('[Resend] rawBody unavailable; is rawBody enabled?');
      throw new ServiceUnavailableException('Webhook verification unavailable');
    }

    const verdict = this.resendService.verifySignature(rawBody, signature);
    if (verdict === 'unconfigured') {
      throw new ServiceUnavailableException('Webhook verification unavailable');
    }
    if (verdict === 'invalid') {
      // 401, as this controller's own contract documents. The original threw a
      // bare `new Error` for a missing header, which the filter turns into a
      // 500 — telling Resend to retry a request that can never succeed.
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      this.logger.warn('[Resend] Webhook body is not JSON');
      return { success: false };
    }

    if (typeof payload !== 'object' || payload === null) {
      this.logger.warn('[Resend] Webhook payload is not an object');
      return { success: false };
    }

    const result = await this.resendService.processEvent(payload as never);
    return { success: result.processed };
  }
}
