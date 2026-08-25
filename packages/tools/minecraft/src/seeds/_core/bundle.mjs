/**
 * bundle.mjs — the curated worldgen bundle format.
 *
 * A bundle is one deflate stream over a JSON index plus every file's bytes
 * concatenated. It exists because a .zip is the wrong shape for this payload:
 * these packs are thousands of ~2 KB JSON files that share nearly all their
 * vocabulary ("minecraft:", "density_function", the same argument names), and
 * a zip compresses each one against nothing but itself.
 *
 *   vanilla 1.21.1   744 files, 5.49 MB raw   385 KB as .zip   112 KB here
 *   terralith 2.6.2 1632 files, 5.57 MB raw   878 KB as .zip   192 KB here
 *
 * The layout, after inflating:
 *
 *   magic   5 bytes   "BSWG1"
 *   ilen    uint32be  byte length of the index
 *   index   JSON      [[relPath, byteLength], ...] in blob order
 *   blob    bytes     every file back to back, index order
 *
 * `inflate` / `deflate` are injected rather than imported so this module stays
 * free of even fflate — the builder passes the sync Node-side functions and the
 * browser passes fflate's, and neither has to agree on anything else.
 */

const MAGIC = 'BSWG1';
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * @param {Record<string, Uint8Array>|Map<string, Uint8Array>} files
 * @param {(b: Uint8Array, o?: object) => Uint8Array} deflate
 * @returns {Uint8Array}
 */
export function packBundle(files, deflate) {
  const entries = [...(files instanceof Map ? files : Object.entries(files))]
    // Sorted so a rebuild from identical inputs is byte-identical, which is
    // what lets these be served immutably.
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  const index = entries.map(([rel, data]) => [rel, data.length]);
  const head = enc.encode(JSON.stringify(index));
  const blobLen = entries.reduce((n, [, d]) => n + d.length, 0);

  const out = new Uint8Array(MAGIC.length + 4 + head.length + blobLen);
  out.set(enc.encode(MAGIC), 0);
  new DataView(out.buffer).setUint32(MAGIC.length, head.length);
  out.set(head, MAGIC.length + 4);
  let off = MAGIC.length + 4 + head.length;
  for (const [, data] of entries) { out.set(data, off); off += data.length; }

  return deflate(out, { level: 9 });
}

/**
 * @param {Uint8Array} bytes the fetched bundle
 * @param {(b: Uint8Array) => Uint8Array} inflate
 * @returns {Map<string, Uint8Array>}
 */
export function unpackBundle(bytes, inflate) {
  const buf = inflate(bytes);
  if (dec.decode(buf.subarray(0, MAGIC.length)) !== MAGIC) {
    throw new Error('Not a worldgen bundle (bad magic) — a stale or truncated download?');
  }
  const ilen = new DataView(buf.buffer, buf.byteOffset).getUint32(MAGIC.length);
  const index = JSON.parse(dec.decode(buf.subarray(MAGIC.length + 4, MAGIC.length + 4 + ilen)));

  const files = new Map();
  let off = MAGIC.length + 4 + ilen;
  for (const [rel, len] of index) {
    // subarray, not slice: the blob is already one allocation and every consumer
    // only ever reads. Copying it would double the peak memory for nothing.
    files.set(rel, buf.subarray(off, off + len));
    off += len;
  }
  return files;
}
