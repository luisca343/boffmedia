import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/config/env';

/**
 * Authenticated encryption for the few secrets the API has to store in a
 * RECOVERABLE form.
 *
 * Almost nothing here needs this: a password, a reset token and a backup code
 * are only ever compared, so they are hashed and the plaintext is thrown away.
 * A TOTP shared secret is different — verifying a six-digit code means
 * regenerating it, so the secret must come back out of the database intact. A
 * hash cannot do that, and plaintext turns one database dump into a working
 * second factor for every admin at once.
 *
 * AES-256-GCM, key from `SECRET_ENCRYPTION_KEY` (64 hex characters = 32 bytes).
 * GCM rather than CBC because the tag makes a tampered ciphertext fail loudly
 * instead of decrypting to garbage that then gets fed to a code generator.
 *
 * Serialised as `v1.<iv>.<tag>.<ciphertext>`, all base64url. The version prefix
 * is what lets the key be rotated later without guessing at the old format.
 */

const VERSION = 'v1';
/** 96 bits — the size GCM is defined for; anything else costs a rehash of the IV. */
const IV_BYTES = 12;
const KEY_BYTES = 32;

/** Thrown when a secret is about to be written and there is no key to write it
 *  under. Deliberately fatal at the call site rather than a silent fallback to
 *  plaintext: a "temporarily unencrypted" secret is one nobody ever comes back
 *  to re-encrypt. */
export class SecretKeyUnavailableError extends Error {
  constructor() {
    super(
      'SECRET_ENCRYPTION_KEY is not configured — refusing to store a secret in plaintext',
    );
    this.name = 'SecretKeyUnavailableError';
  }
}

let cachedKey: Buffer | null = null;

/**
 * The key is optional in config so dev and the test suite boot without it (same
 * choice as TERAS_API_TOKEN). Everything that needs it fails closed instead.
 */
export function secretEncryptionAvailable(): boolean {
  return Boolean(env.SECRET_ENCRYPTION_KEY);
}

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = env.SECRET_ENCRYPTION_KEY;
  if (!raw) throw new SecretKeyUnavailableError();
  const buf = Buffer.from(raw, 'hex');
  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `SECRET_ENCRYPTION_KEY must be ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes)`,
    );
  }
  cachedKey = buf;
  return buf;
}

/** Test seam: the key is cached after first use, so a suite that swaps the env
 *  value between cases has to clear it. */
export function resetSecretBoxKeyCache(): void {
  cachedKey = null;
}

export function sealSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return [
    VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ct.toString('base64url'),
  ].join('.');
}

export function openSecret(sealed: string): string {
  const [version, ivB64, tagB64, ctB64] = sealed.split('.');
  if (version !== VERSION || !ivB64 || !tagB64 || !ctB64) {
    throw new Error('Sealed secret is malformed or of an unknown version');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
