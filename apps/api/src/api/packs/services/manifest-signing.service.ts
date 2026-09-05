import {
  createPrivateKey,
  createPublicKey,
  sign,
  type KeyObject,
} from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

import { env } from '@/config/env';

/**
 * D15, the server half — and only the server half, deliberately.
 *
 * WHY THE ORDER MATTERS MORE THAN THE CRYPTO. A client that REQUIRES a signature
 * bricks every install in the field the moment it ships ahead of a server that
 * produces one. So the server signs for a full release cycle first, nothing
 * verifies, and only a later launcher build starts checking. That sequencing is
 * the same trap D3 has, and it is why the first of four previous attempts at
 * this was reverted: it made the launcher demand an `x-boff-manifest-hmac`
 * header the API never sent, so every pack install would have failed on its
 * first real call.
 *
 * WHAT THE OTHER THREE ATTEMPTS GOT WRONG, recorded so it is not rediscovered:
 *
 *  - a SYMMETRIC key compiled into a binary users download. It defends against
 *    an attacker who can extract it in minutes, which is to say it defends
 *    against nobody. Asymmetric only: the private key never leaves the server,
 *    and the launcher ships a public key it does not matter that anyone can
 *    read.
 *  - a server `signManifest()` that was a TODO comment, shipped alongside the
 *    one working tamper test DISABLED. Its stated blocker ("once @noble/ed25519
 *    is available") was false: Node has ed25519 in `crypto`, which is what this
 *    uses. No dependency was needed and none is added.
 *  - re-serialising the manifest to sign it. `serde_json` and `JSON.stringify`
 *    disagree on key order and on escaping, so the client would rebuild
 *    different bytes and every signature would fail — silently, at install
 *    time, on a user's machine. See `signedManifest()` in the controller: the
 *    signed span is the exact byte string sent on the wire, and the client must
 *    verify what it received rather than what it parsed.
 *
 * INERT WITHOUT A KEY, and loudly so. With `PACK_SIGNING_PRIVATE_KEY` unset,
 * `enabled` is false and the signed endpoint answers 503. It does NOT fall back
 * to serving an unsigned body from a signed route: a client that later trusts
 * that route would accept an unsigned manifest, which is worse than having no
 * signature at all.
 */
@Injectable()
export class ManifestSigningService {
  private readonly logger = new Logger(ManifestSigningService.name);
  private readonly privateKey: KeyObject | null;
  private readonly publicKeyDer: Buffer | null;

  constructor() {
    const raw = env.PACK_SIGNING_PRIVATE_KEY;
    if (!raw) {
      this.privateKey = null;
      this.publicKeyDer = null;
      this.logger.log(
        'PACK_SIGNING_PRIVATE_KEY is not set — pack manifests are not signed and ' +
          'the signed endpoint answers 503. Generate a keypair with ' +
          '`node scripts/generate-pack-signing-key.mjs`.',
      );
      return;
    }

    try {
      // PKCS#8 DER, base64. That is what the generator script emits, and it is
      // the one encoding Node reads back without a format guess.
      const der = Buffer.from(raw, 'base64');
      const key = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
      if (key.asymmetricKeyType !== 'ed25519') {
        throw new Error(
          `expected an ed25519 key, got ${key.asymmetricKeyType ?? 'an unknown type'}`,
        );
      }
      this.privateKey = key;
      this.publicKeyDer = createPublicKey(key).export({
        format: 'der',
        type: 'spki',
      });
      this.logger.log('Pack manifest signing is ON (ed25519).');
    } catch (e) {
      // Refusing to boot would take the whole API down over an optional
      // feature. Refusing to SIGN is the safe half: the signed route 503s, and
      // this line says why.
      this.privateKey = null;
      this.publicKeyDer = null;
      this.logger.error(
        `PACK_SIGNING_PRIVATE_KEY is set but unusable (${(e as Error).message}). ` +
          'Manifests will not be signed. It must be a base64 PKCS#8 ed25519 private key.',
      );
    }
  }

  get enabled(): boolean {
    return this.privateKey !== null;
  }

  /** The verification key, base64 SPKI DER. Public by design. */
  publicKey(): string | null {
    return this.publicKeyDer ? this.publicKeyDer.toString('base64') : null;
  }

  /**
   * Sign exactly these bytes.
   *
   * Takes a Buffer, not an object, and that is the whole point: the caller has
   * already decided what goes on the wire, and this signs that. An overload
   * taking an object would invite exactly the re-serialisation bug that killed
   * the third attempt.
   *
   * ed25519 takes no digest argument — `sign(null, …)` is correct, not an
   * oversight.
   */
  sign(body: Buffer): string | null {
    if (!this.privateKey) return null;
    return sign(null, body, this.privateKey).toString('base64');
  }
}
