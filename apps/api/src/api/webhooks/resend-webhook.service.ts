import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/config/env';
import { EmailBounceRepository } from './repositories/email-bounce.repository';

/**
 * Resend webhook handler. Verifies HMAC-SHA256 signature and processes
 * bounce and complaint events.
 *
 * Security: Resend signs webhooks with HMAC-SHA256(request_body, secret).
 * An unverified payload is treated as hostile (possible injection attempt).
 *
 * Hops:
 * 1. POST /webhooks/resend with signed payload
 * 2. Verify signature against env.RESEND_WEBHOOK_SECRET
 * 3. Parse event type (bounce, complaint, delivered)
 * 4. Update user's email_bounced flag in database
 * 5. Return 200 OK
 */
@Injectable()
export class ResendWebhookService {
  private readonly logger = new Logger(ResendWebhookService.name);

  constructor(private readonly bounces: EmailBounceRepository) {}

  /**
   * Verify Resend webhook signature.
   *
   * Resend sends: x-resend-signature header = base64(hmac-sha256(body, secret))
   *
   * @param body - Raw request body (string)
   * @param signature - x-resend-signature header value
   */
  /**
   * Verify Resend's HMAC over the RAW request body.
   *
   * Returns a verdict rather than throwing: choosing an HTTP status is the
   * controller's job, and services here are being migrated off Nest exceptions
   * (check-domain-errors.mjs ratchets on it).
   *
   * `unconfigured` must be treated as a refusal, never as a pass. This route is
   * @Public(), and marking an address as bounced stops its password-reset mail,
   * so a caller we cannot authenticate could lock any account whose address
   * they know out of every recovery path. The original skipped verification
   * entirely when the secret was unset and merely logged a warning, which turns
   * a forgotten env var into exactly that hole, silently.
   */
  verifySignature(
    rawBody: Buffer | string,
    signature: string | undefined,
  ): 'ok' | 'unconfigured' | 'invalid' {
    const secret = env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error(
        '[Resend] RESEND_WEBHOOK_SECRET is not set; refusing the webhook',
      );
      return 'unconfigured';
    }
    if (!signature) return 'invalid';

    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    // Constant time, length-checked first because timingSafeEqual throws on a
    // length mismatch. `!==` on an HMAC leaks how far the comparison got.
    const given = Buffer.from(signature, 'utf8');
    const want = Buffer.from(expected, 'utf8');
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      // Deliberately does not log the expected value: it is secret-derived, and
      // the original printed its first 20 characters on every failure, which is
      // an oracle anyone able to reach the route could farm out of the logs.
      this.logger.warn('[Resend] Rejected a webhook with an invalid signature');
      return 'invalid';
    }

    return 'ok';
  }

  /**
   * Process bounce or complaint event. Sets email_bounced=true.
   *
   * Event types:
   * - "email.bounced": hard bounce, soft bounce → bounce is permanent, don't retry
   * - "email.complained": user marked as spam → complaint is permanent
   * - "email.delivered": successful delivery → OK to track
   *
   * @param event - Parsed Resend event
   */
  async processEvent(
    event: ResendEvent,
  ): Promise<{ processed: boolean; reason?: string }> {
    const { type, data } = event;

    // Only process bounce and complaint events
    if (type !== 'email.bounced' && type !== 'email.complained') {
      return {
        processed: false,
        reason: `Event type ${type} not processed`,
      };
    }

    const email = data.email as string | undefined;
    if (!email) {
      this.logger.warn(`[Resend] Event has no email field`);
      return { processed: false, reason: 'No email in event' };
    }

    try {
      const marked = await this.bounces.markBounced(email, new Date());

      if (!marked) {
        this.logger.debug(
          `[Resend] No user found for email ${email.slice(0, 3)}...`,
        );
        return { processed: false, reason: 'User not found' };
      }

      this.logger.log(
        `[Resend] Marked ${email.slice(0, 3)}... as bounced (event: ${type})`,
      );
      return { processed: true };
    } catch (error) {
      this.logger.error(`[Resend] Failed to process event for ${email}`, error);
      throw error;
    }
  }
}

/**
 * Resend webhook event schema (simplified).
 * Full spec: https://resend.com/docs/webhooks
 */
interface ResendEvent {
  type:
    | 'email.bounced'
    | 'email.complained'
    | 'email.delivered'
    | 'email.sent'
    | 'email.opens'
    | 'email.clicks';
  created_at: string;
  data: {
    email?: string;
    bounce_type?: 'permanent' | 'temporary';
    bounce_sub_type?: string;
    [key: string]: unknown;
  };
}
