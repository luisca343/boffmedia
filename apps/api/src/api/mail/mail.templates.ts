/**
 * Per-locale copy for the transactional emails.
 *
 * Emails are composed server-side with no browser to translate them, so they
 * cannot use the web's next-intl catalog. They are keyed off the user's STORED
 * locale preference (`boffmedia_users.locale`, migration 0034) and fall back to
 * Spanish when it is unset or unknown — deliberately not request
 * `Accept-Language`, which is wrong for anything the user did not trigger.
 *
 * Adding a locale: add a key here and to `MailLocale`. Every locale must
 * define both templates; there is no per-key fallback, only a whole-locale one.
 */

interface MailTemplate {
  subject: string;
  heading: string;
  intro: string;
  cta: string;
  footer: string;
  text: (link: string) => string;
}

interface MailCopy {
  /** Value for the document's `lang` attribute. */
  lang: string;
  fallbackLinkLabel: string;
  passwordReset: MailTemplate;
  emailVerification: MailTemplate;
}

export const MAIL_TEMPLATES = {
  es: {
    lang: 'es',
    fallbackLinkLabel:
      'Si el botón no funciona, copia y pega este enlace en tu navegador:',
    passwordReset: {
      subject: 'Restablece tu contraseña · BoffMedia',
      heading: 'Restablece tu contraseña',
      intro:
        'Recibimos una solicitud para restablecer tu contraseña. Este enlace caduca en 1 hora.',
      cta: 'Restablecer contraseña',
      footer: 'Si no fuiste tú, puedes ignorar este correo con seguridad.',
      text: (link: string) =>
        `Restablece tu contraseña abriendo este enlace (caduca en 1 hora): ${link}\n\nSi no fuiste tú, ignora este correo.`,
    },
    emailVerification: {
      subject: 'Verifica tu correo · BoffMedia',
      heading: 'Verifica tu correo',
      intro:
        '¡Bienvenido a BoffMedia! Confirma tu dirección de correo para activar tu cuenta. Este enlace caduca en 24 horas.',
      cta: 'Verificar correo',
      footer: 'Si no creaste esta cuenta, puedes ignorar este correo.',
      text: (link: string) =>
        `Verifica tu correo abriendo este enlace (caduca en 24 horas): ${link}\n\nSi no creaste esta cuenta, ignora este correo.`,
    },
  },
  en: {
    lang: 'en',
    fallbackLinkLabel:
      "If the button doesn't work, copy and paste this link into your browser:",
    passwordReset: {
      subject: 'Reset your password · BoffMedia',
      heading: 'Reset your password',
      intro:
        'We received a request to reset your password. This link expires in 1 hour.',
      cta: 'Reset password',
      footer: "If this wasn't you, you can safely ignore this email.",
      text: (link: string) =>
        `Reset your password by opening this link (expires in 1 hour): ${link}\n\nIf this wasn't you, ignore this email.`,
    },
    emailVerification: {
      subject: 'Verify your email · BoffMedia',
      heading: 'Verify your email',
      intro:
        'Welcome to BoffMedia! Confirm your email address to activate your account. This link expires in 24 hours.',
      cta: 'Verify email',
      footer: "If you didn't create this account, you can ignore this email.",
      text: (link: string) =>
        `Verify your email by opening this link (expires in 24 hours): ${link}\n\nIf you didn't create this account, ignore this email.`,
    },
  },
} satisfies Record<string, MailCopy>;

export type MailLocale = keyof typeof MAIL_TEMPLATES;

export const DEFAULT_MAIL_LOCALE: MailLocale = 'es';
