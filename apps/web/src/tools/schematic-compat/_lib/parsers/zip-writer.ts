/**
 * Minimal streaming ZIP *writer* — the counterpart to {@link ./zip-central}.
 *
 * Each added file is deflate-compressed (falling back to stored if that doesn't
 * help) and its header + data are pushed as {@link Blob} parts, so the bulk lives
 * in browser blob storage (spillable to disk) rather than the JS heap. That lets
 * us package a very large prefab export — dozens of multi-MB tiles — into one
 * archive without ever holding the whole thing in memory at once.
 *
 * Standard ZIP only (no ZIP64): a per-entry or total size ≥ 4 GB, or > 65535
 * entries, throws rather than silently producing a corrupt archive.
 */
import { deflateRaw } from "pako";

const LOCAL_SIG = 0x04034b50;
const CD_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const MAX_U32 = 0xffffffff;
const MAX_U16 = 0xffff;
// A fixed valid MS-DOS date (1980-01-01); we don't track real mtimes.
const DOS_DATE = 0x0021;

let CRC_TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface CentralRecord {
  nameBytes: Uint8Array;
  crc: number;
  compSize: number;
  uncompSize: number;
  offset: number;
  method: number;
}

export class ZipWriter {
  private parts: BlobPart[] = [];
  private records: CentralRecord[] = [];
  private offset = 0;
  private readonly encoder = new TextEncoder();

  /**
   * Add one file. `data` is consumed immediately (compressed + offloaded to a
   * Blob part), so the caller can drop its reference right after.
   */
  add(name: string, data: Uint8Array, compress = true): void {
    const nameBytes = this.encoder.encode(name);
    const crc = crc32(data);
    const uncompSize = data.length;

    let body: Uint8Array = data;
    let method = 0; // stored
    if (compress) {
      const z = deflateRaw(data, { level: 6 });
      if (z.length < data.length) {
        body = z;
        method = 8; // deflate
      }
    }
    const compSize = body.length;
    if (uncompSize > MAX_U32 || compSize > MAX_U32) {
      throw new Error("ZIP entry exceeds the 4 GB standard-ZIP limit.");
    }

    const header = new Uint8Array(30 + nameBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, LOCAL_SIG, true);
    hv.setUint16(4, 20, true); // version needed to extract
    hv.setUint16(6, 0, true); // general-purpose flags
    hv.setUint16(8, method, true);
    hv.setUint16(10, 0, true); // mod time
    hv.setUint16(12, DOS_DATE, true); // mod date
    hv.setUint32(14, crc, true);
    hv.setUint32(18, compSize, true);
    hv.setUint32(22, uncompSize, true);
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, 0, true); // extra length
    header.set(nameBytes, 30);

    // Header stays a tiny Uint8Array; the (possibly multi-MB) body goes to a Blob
    // so it leaves the JS heap immediately.
    this.parts.push(header, new Blob([body as BlobPart]));
    this.records.push({ nameBytes, crc, compSize, uncompSize, offset: this.offset, method });
    this.offset += header.length + compSize;
    if (this.offset > MAX_U32) {
      throw new Error("Archive exceeds the 4 GB standard-ZIP limit (too many / too-large tiles).");
    }
  }

  /** Emit the central directory + EOCD and return the finished archive. */
  finish(mimeType = "application/zip"): Blob {
    if (this.records.length > MAX_U16) {
      throw new Error("Archive exceeds the 65535-entry standard-ZIP limit.");
    }
    const cdStart = this.offset;
    let cdSize = 0;
    for (const e of this.records) {
      const rec = new Uint8Array(46 + e.nameBytes.length);
      const dv = new DataView(rec.buffer);
      dv.setUint32(0, CD_SIG, true);
      dv.setUint16(4, 20, true); // version made by
      dv.setUint16(6, 20, true); // version needed
      dv.setUint16(8, 0, true); // flags
      dv.setUint16(10, e.method, true);
      dv.setUint16(12, 0, true); // time
      dv.setUint16(14, DOS_DATE, true); // date
      dv.setUint32(16, e.crc, true);
      dv.setUint32(20, e.compSize, true);
      dv.setUint32(24, e.uncompSize, true);
      dv.setUint16(28, e.nameBytes.length, true);
      dv.setUint16(30, 0, true); // extra length
      dv.setUint16(32, 0, true); // comment length
      dv.setUint16(34, 0, true); // disk number start
      dv.setUint16(36, 0, true); // internal attrs
      dv.setUint32(38, 0, true); // external attrs
      dv.setUint32(42, e.offset, true);
      rec.set(e.nameBytes, 46);
      this.parts.push(rec);
      cdSize += rec.length;
    }

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, EOCD_SIG, true);
    ev.setUint16(4, 0, true); // this disk
    ev.setUint16(6, 0, true); // disk with CD
    ev.setUint16(8, this.records.length, true); // entries this disk
    ev.setUint16(10, this.records.length, true); // total entries
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, cdStart, true);
    ev.setUint16(20, 0, true); // comment length
    this.parts.push(eocd);

    return new Blob(this.parts, { type: mimeType });
  }
}
