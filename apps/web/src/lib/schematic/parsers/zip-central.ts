/**
 * Minimal ZIP central-directory reader.
 *
 * Hytale's `Assets.zip` is ~3.4 GB — far too large to load into a browser tab.
 * We only need the *list of entry names* (the block catalog is derived from
 * icon/texture filenames), which lives in the central directory at the end of
 * the archive. This reader uses `File.slice()` so the browser fetches just the
 * EOCD record and the central directory off disk — a few MB total, no full read.
 *
 * Standard ZIP only (no ZIP64). Assets.zip is < 4 GB with < 65535 entries, so a
 * classic End-Of-Central-Directory record applies; ZIP64 is detected and
 * rejected with a clear error rather than mis-parsed.
 */

import { inflateRaw } from "pako";

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;
const ZIP64_LOCATOR_SIG = 0x07064b50;
const EOCD_MIN_SIZE = 22;
/** EOCD may be followed by a comment up to 65535 bytes. Scan a generous tail. */
const TAIL_SCAN = 65557;

/** A single central-directory record (just the fields we need to extract data). */
export interface ZipEntry {
  name: string;
  /** Compression method: 0 = stored, 8 = deflate. */
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  /** Offset of the entry's *local* file header within the archive. */
  localHeaderOffset: number;
}

async function sliceBytes(file: Blob, start: number, end: number): Promise<DataView> {
  const buf = await file.slice(start, end).arrayBuffer();
  return new DataView(buf);
}

interface Eocd {
  cdOffset: number;
  cdSize: number;
  totalEntries: number;
}

function findEocd(view: DataView, tailStart: number): Eocd {
  // Scan backwards for the EOCD signature.
  for (let i = view.byteLength - EOCD_MIN_SIZE; i >= 0; i--) {
    if (view.getUint32(i, true) !== EOCD_SIG) continue;
    const totalEntries = view.getUint16(i + 10, true);
    const cdSize = view.getUint32(i + 12, true);
    const cdOffset = view.getUint32(i + 16, true);
    if (cdOffset === 0xffffffff || cdSize === 0xffffffff || totalEntries === 0xffff) {
      throw new Error("ZIP64 archive is not supported.");
    }
    void tailStart;
    return { cdOffset, cdSize, totalEntries };
  }
  throw new Error("Not a ZIP file (no end-of-central-directory record found).");
}

/**
 * Read every entry's central-directory record from a ZIP.
 * Returns full {@link ZipEntry} records (name + the offsets/sizes needed to
 * later extract an entry's bytes via {@link extractZipEntry}).
 */
export async function readZipEntries(file: Blob): Promise<ZipEntry[]> {
  const size = file.size;
  if (size < EOCD_MIN_SIZE) throw new Error("File too small to be a ZIP.");

  const tailStart = Math.max(0, size - TAIL_SCAN);
  const tail = await sliceBytes(file, tailStart, size);

  // Reject ZIP64 early if its locator is present in the tail.
  for (let i = tail.byteLength - 4; i >= 0; i--) {
    if (tail.getUint32(i, true) === ZIP64_LOCATOR_SIG) {
      throw new Error("ZIP64 archive is not supported.");
    }
  }

  const eocd = findEocd(tail, tailStart);

  const cd = await sliceBytes(file, eocd.cdOffset, eocd.cdOffset + eocd.cdSize);
  const decoder = new TextDecoder("utf-8");
  const entries: ZipEntry[] = [];

  let p = 0;
  for (let n = 0; n < eocd.totalEntries; n++) {
    if (p + 46 > cd.byteLength) break;
    if (cd.getUint32(p, true) !== CD_SIG) break;
    const method = cd.getUint16(p + 10, true);
    const compressedSize = cd.getUint32(p + 20, true);
    const uncompressedSize = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    const localHeaderOffset = cd.getUint32(p + 42, true);
    const nameStart = p + 46;
    const nameBytes = new Uint8Array(cd.buffer, cd.byteOffset + nameStart, nameLen);
    entries.push({
      name: decoder.decode(nameBytes),
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    p = nameStart + nameLen + extraLen + commentLen;
  }

  return entries;
}

/**
 * Read every entry's filename from a ZIP's central directory.
 * Returns the list of entry paths (e.g. `Common/Icons/ItemsGenerated/Rock_Stone.png`).
 */
export async function readZipEntryNames(file: Blob): Promise<string[]> {
  return (await readZipEntries(file)).map((e) => e.name);
}

/**
 * Extract and decompress a single entry's bytes via `File.slice()` — reads only
 * that entry's local header + compressed data off disk, never the whole archive.
 * Supports stored (0) and deflate (8); other methods throw.
 */
export async function extractZipEntry(file: Blob, entry: ZipEntry): Promise<Uint8Array> {
  // The local header's name/extra lengths can differ from the central record,
  // so read the local header to find where the data actually starts.
  const header = await sliceBytes(file, entry.localHeaderOffset, entry.localHeaderOffset + 30);
  if (header.getUint32(0, true) !== LOCAL_SIG) {
    throw new Error("Bad local file header.");
  }
  const nameLen = header.getUint16(26, true);
  const extraLen = header.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + nameLen + extraLen;

  const raw = new Uint8Array(
    await file.slice(dataStart, dataStart + entry.compressedSize).arrayBuffer(),
  );

  if (entry.method === 0) return raw;
  if (entry.method === 8) return inflateRaw(raw);
  throw new Error(`Unsupported ZIP compression method: ${entry.method}`);
}
