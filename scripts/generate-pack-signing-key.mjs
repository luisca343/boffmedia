#!/usr/bin/env node
/**
 * D15. Make the ed25519 keypair that signs pack manifests.
 *
 * Prints the PRIVATE key for `PACK_SIGNING_PRIVATE_KEY` and the PUBLIC key that
 * a future launcher build will ship to verify with. Writes nothing to disk and
 * touches no env file: the private half is a secret, and a script that helpfully
 * appends it to `.env` is a script that eventually appends it to the wrong one.
 *
 * Node's own `crypto` does ed25519. The third reverted attempt at D15 stalled on
 * "once @noble/ed25519 is available", which was never true -- no dependency is
 * needed here and none is added.
 */
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');

const priv = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
const pub = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');

console.log(`
Pack manifest signing keypair (ed25519)
=======================================

1. PRIVATE -- put this in the API's environment, and nowhere else:

PACK_SIGNING_PRIVATE_KEY=${priv}

2. PUBLIC -- served at GET /packs/launcher/manifest-key once the API restarts,
   and safe to publish anywhere:

${pub}

Rotating: set the new private key, restart, and leave a launcher that pins the
OLD public key alone until it has been replaced -- a pinned client cannot verify
a manifest signed with a key it has never seen, and it would refuse every
install.
`);
