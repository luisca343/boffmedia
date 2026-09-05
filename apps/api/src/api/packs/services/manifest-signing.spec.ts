import { generateKeyPairSync, verify, createPublicKey } from 'node:crypto';

import { ManifestSigningService } from './manifest-signing.service';

/**
 * D15. Four previous attempts were reverted, and one of them shipped with the
 * only working tamper test DISABLED. So the tests here are specifically the
 * ones that would have caught each of those failures:
 *
 *   - a signature that does not actually verify (attempt 3 never produced one)
 *   - a tampered body that still verifies (the disabled test)
 *   - re-serialisation producing different bytes (the silent, install-time one)
 *   - a missing key silently behaving as if it were present (fail-open)
 */

jest.mock('@/config/env', () => ({
  env: {} as Record<string, string | undefined>,
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { env } = require('@/config/env') as {
  env: Record<string, string | undefined>;
};

function freshKeypair(): { priv: string; pub: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    priv: privateKey
      .export({ format: 'der', type: 'pkcs8' })
      .toString('base64'),
    pub: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
  };
}

function serviceWith(key: string | undefined): ManifestSigningService {
  env.PACK_SIGNING_PRIVATE_KEY = key;
  return new ManifestSigningService();
}

const verifyWith = (pubB64: string, body: Buffer, sigB64: string): boolean =>
  verify(
    null,
    body,
    createPublicKey({
      key: Buffer.from(pubB64, 'base64'),
      format: 'der',
      type: 'spki',
    }),
    Buffer.from(sigB64, 'base64'),
  );

describe('ManifestSigningService', () => {
  afterEach(() => {
    delete env.PACK_SIGNING_PRIVATE_KEY;
  });

  it('produces a signature that verifies against the served public key', () => {
    const { priv, pub } = freshKeypair();
    const svc = serviceWith(priv);

    expect(svc.enabled).toBe(true);
    // The key the endpoint hands out must be the pair of the one it signs with.
    // Deriving it from the private key rather than configuring it separately is
    // what makes that true by construction, and this proves it.
    expect(svc.publicKey()).toBe(pub);

    const body = Buffer.from(
      JSON.stringify({ formatVersion: 1, pack: { id: 'x' } }),
    );
    const sig = svc.sign(body)!;
    expect(verifyWith(pub, body, sig)).toBe(true);
  });

  it('fails verification when one byte of the body changes', () => {
    // The test a previous attempt DISABLED rather than fixed.
    const { priv, pub } = freshKeypair();
    const svc = serviceWith(priv);

    const body = Buffer.from(
      JSON.stringify({ pack: { id: 'legit' }, version: '1.0.0' }),
    );
    const sig = svc.sign(body)!;

    const tampered = Buffer.from(body.toString().replace('1.0.0', '9.9.9'));
    expect(tampered.length).toBe(body.length); // same length: only a value moved
    expect(verifyWith(pub, tampered, sig)).toBe(false);
  });

  it('fails verification against a different key', () => {
    const a = freshKeypair();
    const b = freshKeypair();
    const body = Buffer.from('{"pack":"x"}');
    const sig = serviceWith(a.priv).sign(body)!;
    expect(verifyWith(b.pub, body, sig)).toBe(false);
  });

  it('shows why the signed span must be the bytes on the wire, not a re-serialisation', () => {
    // THE BUG THAT KILLED ATTEMPT 3, demonstrated rather than described.
    // serde_json and JSON.stringify disagree on key order; two serialisations
    // of the same object are two different byte strings, and a signature over
    // one does not verify the other. The failure is silent and arrives at
    // install time on a user's machine.
    const { priv, pub } = freshKeypair();
    const svc = serviceWith(priv);

    const sent = Buffer.from('{"a":1,"b":2}');
    const sig = svc.sign(sent)!;
    expect(verifyWith(pub, sent, sig)).toBe(true);

    // Same object, different key order -- what a client rebuilds after parsing.
    const rebuilt = Buffer.from('{"b":2,"a":1}');
    expect(JSON.stringify(JSON.parse(sent.toString()))).not.toBe(
      rebuilt.toString(),
    );
    expect(verifyWith(pub, rebuilt, sig)).toBe(false);
  });

  it('is inert, not fail-open, with no key configured', () => {
    const svc = serviceWith(undefined);
    expect(svc.enabled).toBe(false);
    expect(svc.publicKey()).toBeNull();
    // `null`, never an empty string or a fabricated value: the route reads this
    // to decide whether to 503, and anything truthy would let it serve a body
    // from a route a client is entitled to trust.
    expect(svc.sign(Buffer.from('x'))).toBeNull();
  });

  it('is inert when the configured key is unusable, and does not throw at boot', () => {
    // Refusing to construct would take the whole API down over an optional
    // feature; refusing to SIGN is the safe half.
    const svc = serviceWith('not-a-key');
    expect(svc.enabled).toBe(false);
    expect(svc.sign(Buffer.from('x'))).toBeNull();
  });

  it('refuses a valid key of the wrong algorithm', () => {
    // An RSA key is a real key and `createPrivateKey` accepts it happily. Only
    // the explicit algorithm check stops it being used here, where every
    // verifier expects ed25519.
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const der = privateKey
      .export({ format: 'der', type: 'pkcs8' })
      .toString('base64');
    const svc = serviceWith(der);
    expect(svc.enabled).toBe(false);
  });
});
