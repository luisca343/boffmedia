import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import {
  MAIL_TEMPLATES,
  DEFAULT_MAIL_LOCALE,
  type MailLocale,
} from './mail.templates';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Thin email sender. Targets Resend's HTTP API (no SDK dependency — a plain
 * `fetch`), and falls back to logging the message when `RESEND_API_KEY` is
 * absent so local/dev environments work without a provider. Swapping providers
 * is a one-method change here; callers only see `send*`.
 */
@Injectable()
export class MailService {
  constructor(private readonly logger: Logger) {}

  private readonly from = env.MAIL_FROM;
  private readonly apiKey = env.RESEND_API_KEY;
  private readonly webUrl = env.WEB_URL.replace(/\/+$/, '');

  private async send(input: SendMailInput): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        `[MailService] RESEND_API_KEY unset — not sending. To=${input.to} Subject="${input.subject}"`,
      );
      this.logger.debug(`[MailService] Body (text): ${input.text ?? ''}`);
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        // Never surface provider errors to the caller — email failures must not
        // break the auth flow (and forgot-password must not leak whether the
        // address exists). Log and move on.
        this.logger.error(
          `[MailService] Resend responded ${res.status}: ${detail}`,
        );
      }
    } catch (error) {
      this.logger.error('[MailService] Failed to send email', error as Error);
    }
  }

  /**
   * Resolves the user's stored locale preference to a template locale. Unset,
   * unknown or malformed values fall back to Spanish — emails are composed
   * server-side with no browser to translate them, and request
   * `Accept-Language` is the wrong signal for anything the user did not
   * trigger from a browser.
   */
  private resolveLocale(locale?: string | null): MailLocale {
    const base = (locale ?? '').toLowerCase().split(/[-_]/)[0];
    return base in MAIL_TEMPLATES ? (base as MailLocale) : DEFAULT_MAIL_LOCALE;
  }

  /** Password-reset email with a link back to the web reset page. */
  async sendPasswordReset(
    to: string,
    token: string,
    locale?: string | null,
  ): Promise<void> {
    const link = `${this.webUrl}/restablecer?token=${encodeURIComponent(token)}`;
    const copy = MAIL_TEMPLATES[this.resolveLocale(locale)];
    await this.send({
      to,
      subject: copy.passwordReset.subject,
      html: this.layout(
        copy.passwordReset.heading,
        copy.passwordReset.intro,
        copy.passwordReset.cta,
        link,
        copy.passwordReset.footer,
        copy.lang,
        copy.fallbackLinkLabel,
      ),
      text: copy.passwordReset.text(link),
    });
  }

  /** Email-verification email with a link back to the web verify page. */
  async sendEmailVerification(
    to: string,
    token: string,
    locale?: string | null,
  ): Promise<void> {
    const link = `${this.webUrl}/verificar-email?token=${encodeURIComponent(token)}`;
    const copy = MAIL_TEMPLATES[this.resolveLocale(locale)];
    await this.send({
      to,
      subject: copy.emailVerification.subject,
      html: this.layout(
        copy.emailVerification.heading,
        copy.emailVerification.intro,
        copy.emailVerification.cta,
        link,
        copy.emailVerification.footer,
        copy.lang,
        copy.fallbackLinkLabel,
      ),
      text: copy.emailVerification.text(link),
    });
  }

  /**
   * Branded, inline-styled, table-based HTML shell shared by the transactional
   * emails. Uses the BoffMedia v3 palette (accent `#ff5c0a`) and logo. Kept
   * email-client-safe: tables for layout, inline styles, a bulletproof button,
   * and a plain-text link fallback.
   */
  private layout(
    heading: string,
    intro: string,
    cta: string,
    link: string,
    footer: string,
    lang: string,
    fallbackLinkLabel: string,
  ): string {
    const logo = `${this.webUrl}/img/boff.png`;
    // Palette (BoffMedia v3): bg #0b0d11 · panel #13161c · line #262b35 ·
    // accent #ff5c0a · ink-on-accent #0b0d11 · text #eef0f3 · muted #9aa3b2.
    return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#08090c;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${intro}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08090c;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:100%;background:#13161c;border:1px solid #262b35;border-top:3px solid #ff5c0a;border-radius:14px;overflow:hidden;">
          <!-- header -->
          <tr>
            <td style="padding:26px 34px 6px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${logo}" width="30" height="30" alt="BoffMedia" style="display:block;width:30px;height:30px;border:0;outline:none;" />
                  </td>
                  <td style="vertical-align:middle;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;font-style:italic;letter-spacing:.4px;color:#eef0f3;">
                    BOFF<span style="color:#ff5c0a;">MEDIA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- body -->
          <tr>
            <td style="padding:16px 34px 6px 34px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 12px 0;font-size:23px;line-height:1.25;font-weight:800;color:#ffffff;">${heading}</h1>
              <p style="margin:0 0 22px 0;font-size:15px;line-height:1.62;color:#9aa3b2;">${intro}</p>
            </td>
          </tr>
          <!-- CTA (bulletproof button) -->
          <tr>
            <td style="padding:0 34px 22px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#ff5c0a" style="border-radius:9px;">
                    <a href="${link}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#0b0d11;text-decoration:none;border-radius:9px;">${cta}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- fallback link -->
          <tr>
            <td style="padding:0 34px 24px 34px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:#6b7280;">${fallbackLinkLabel}</p>
              <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${link}" target="_blank" style="color:#ff7a33;text-decoration:underline;">${link}</a></p>
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td style="padding:18px 34px 26px 34px;border-top:1px solid #262b35;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.55;color:#6b7280;">${footer}</p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#4b5563;">© BoffMedia</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
