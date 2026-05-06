import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readdir, writeFile } from 'fs/promises';
import * as path from 'path';

// ---------------------------------------------------------------------------
// CBZ service
//
// A .cbz file is a ZIP archive of image files. This service builds the archive
// using a pure Node.js implementation (stored mode — no compression, which is
// correct for pre-compressed image formats like JPG/PNG/WebP).
//
// No external dependencies required.
// ---------------------------------------------------------------------------

// ── CRC-32 ───────────────────────────────────────────────────────────────────

/** Pre-computed CRC-32 lookup table (polynomial 0xEDB88320). */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── ZIP builder (stored mode) ─────────────────────────────────────────────────

interface ZipFile {
  name: string;
  data: Buffer;
}

/**
 * Builds a ZIP archive in "stored" mode from the given files.
 * Stored mode is ideal for CBZ files because JPEG/PNG/WebP images are already
 * compressed; compressing them again wastes CPU with no size benefit.
 */
function buildZip(files: ZipFile[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralDirEntries: Buffer[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const dosTime = getDosDateTime();

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const checksum = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);  // signature PK\x03\x04
    localHeader.writeUInt16LE(20, 4);           // version needed: 2.0
    localHeader.writeUInt16LE(0, 6);            // general purpose bit flag
    localHeader.writeUInt16LE(0, 8);            // compression: stored
    localHeader.writeUInt16LE(dosTime.time, 10);
    localHeader.writeUInt16LE(dosTime.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(size, 18);        // compressed size = stored size
    localHeader.writeUInt32LE(size, 22);        // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);           // extra field length
    nameBuf.copy(localHeader, 30);

    offsets.push(currentOffset);
    localHeaders.push(localHeader, file.data);
    currentOffset += localHeader.length + size;

    // Central directory entry (46 bytes + filename)
    const cdEntry = Buffer.alloc(46 + nameBuf.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);  // signature PK\x01\x02
    cdEntry.writeUInt16LE(20, 4);          // version made by: 2.0
    cdEntry.writeUInt16LE(20, 6);          // version needed: 2.0
    cdEntry.writeUInt16LE(0, 8);           // general purpose bit flag
    cdEntry.writeUInt16LE(0, 10);          // compression: stored
    cdEntry.writeUInt16LE(dosTime.time, 12);
    cdEntry.writeUInt16LE(dosTime.date, 14);
    cdEntry.writeUInt32LE(checksum, 16);
    cdEntry.writeUInt32LE(size, 20);       // compressed size
    cdEntry.writeUInt32LE(size, 24);       // uncompressed size
    cdEntry.writeUInt16LE(nameBuf.length, 28);
    cdEntry.writeUInt16LE(0, 30);          // extra field length
    cdEntry.writeUInt16LE(0, 32);          // file comment length
    cdEntry.writeUInt16LE(0, 34);          // disk number start
    cdEntry.writeUInt16LE(0, 36);          // internal file attributes
    cdEntry.writeUInt32LE(0, 38);          // external file attributes
    cdEntry.writeUInt32LE(offsets[offsets.length - 1], 42); // local header offset
    nameBuf.copy(cdEntry, 46);

    centralDirEntries.push(cdEntry);
  }

  const centralDir = Buffer.concat(centralDirEntries);
  const centralDirOffset = currentOffset;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);        // signature PK\x05\x06
  eocd.writeUInt16LE(0, 4);                 // disk number
  eocd.writeUInt16LE(0, 6);                 // disk with central dir
  eocd.writeUInt16LE(files.length, 8);      // entries on this disk
  eocd.writeUInt16LE(files.length, 10);     // total entries
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);               // comment length

  return Buffer.concat([...localHeaders, centralDir, eocd]);
}

function getDosDateTime(): { time: number; date: number } {
  const now = new Date();
  const time = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const date = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);
  return { time, date };
}

// ── Image extension helpers ──────────────────────────────────────────────────

/** Returns a file extension for an image URL (jpg, png, webp, etc.). Defaults to "jpg". */
function imageExtension(imageUrl: string): string {
  try {
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath).toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  } catch { /* ignore */ }
  return 'jpg';
}

// ── Path helpers ─────────────────────────────────────────────────────────────

const MANGA_BASE = path.join(process.cwd(), 'laboon', 'manga', 'downloads', 'mangas');

/** Sanitizes a series or chapter name so it is safe to use as a filesystem path segment. */
function sanitizeName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')  // forbidden chars
    .replace(/\.+$/, '')                        // trailing dots
    .trim()
    .substring(0, 200);
}

/** Zero-pads a chapter number string for consistent filename sorting. */
function padChapterNumber(num: string): string {
  const parts = num.split('.');
  const intPart = parts[0].padStart(4, '0');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

@Injectable()
export class CbzService {
  private readonly logger = new Logger(CbzService.name);

  /**
   * Returns the save directory for a manga series.
   */
  seriesDir(seriesName: string): string {
    return path.join(MANGA_BASE, sanitizeName(seriesName));
  }

  /**
   * Derives the CBZ filename for a chapter.
   * Example: "Chapter 0042 - The Beginning.cbz"
   */
  chapterFilename(chapterNumber: string, chapterTitle: string): string {
    const paddedNum = padChapterNumber(chapterNumber);
    const safeName  = sanitizeName(chapterTitle);
    return `Chapter ${paddedNum} - ${safeName}.cbz`;
  }

  /**
   * Checks whether a CBZ for the given chapter already exists on disk.
   */
  async chapterExists(seriesName: string, chapterNumber: string, chapterTitle: string): Promise<boolean> {
    const filePath = path.join(this.seriesDir(seriesName), this.chapterFilename(chapterNumber, chapterTitle));
    try {
      await import('fs/promises').then(fs => fs.access(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Builds a CBZ archive from an array of image buffers and saves it to disk.
   *
   * @param seriesName    Manga series name (used as folder name)
   * @param chapterNumber Chapter number string, e.g. "42" or "1.5"
   * @param chapterTitle  Full chapter title, e.g. "Chapter 42 - The Duel"
   * @param images        Array of { data: Buffer, url: string } in page order
   * @returns             The absolute path to the saved file
   */
  async saveChapter(
    seriesName: string,
    chapterNumber: string,
    chapterTitle: string,
    images: { data: Buffer; url: string }[],
  ): Promise<string> {
    const dir = this.seriesDir(seriesName);
    await mkdir(dir, { recursive: true });

    const filename = this.chapterFilename(chapterNumber, chapterTitle);
    const filePath = path.join(dir, filename);

    const zipFiles: ZipFile[] = images.map(({ data, url }, i) => ({
      name: `${String(i + 1).padStart(4, '0')}.${imageExtension(url)}`,
      data,
    }));

    const cbzBuffer = buildZip(zipFiles);
    await writeFile(filePath, cbzBuffer);

    this.logger.log(`[CBZ] Saved ${filename} (${images.length} pages, ${(cbzBuffer.length / 1024).toFixed(1)} KB)`);
    return filePath;
  }

  /**
   * Lists all .cbz files already downloaded for a series.
   */
  async listLocalChapters(seriesName: string): Promise<string[]> {
    const dir = this.seriesDir(seriesName);
    try {
      const files = await readdir(dir);
      return files.filter(f => f.toLowerCase().endsWith('.cbz')).sort();
    } catch {
      return [];
    }
  }
}
