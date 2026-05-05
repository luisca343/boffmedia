// ---------------------------------------------------------------------------
// manga-epub.builder.ts — Converts chapter images to EPUB via Calibre's
// ebook-convert CLI (https://calibre-ebook.com).
//
// Workflow: image files on disk → normalise to JPEG → temp CBZ → ebook-convert → .epub
//
// WebP images (common on manga/manwha CDNs) are converted to JPEG with sharp
// before packaging so Calibre receives proper color JPEGs and does not apply
// its greyscale comic-processing pipeline to unknown formats.
//
// Requires `ebook-convert` on PATH. In Docker the Dockerfile installs
// `calibre` via apt-get so it is always available in production.
// ---------------------------------------------------------------------------

import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

export interface EpubChapterOptions {
  /** Absolute paths to image files, in display order. */
  imageFiles: string[];
  /** Full output path including .epub extension. */
  outputPath: string;
  seriesTitle?: string;
  chapterTitle?: string;
  chapterNumber?: number | null;
}

/** Returns true when the buffer contains a WebP image (magic bytes). */
function isWebP(data: Buffer): boolean {
  return (
    data.length >= 12 &&
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  );
}

/**
 * Converts a WebP buffer to a color JPEG buffer.
 * `.flatten()` composites any alpha channel over white before encoding.
 * `.toColorspace('srgb')` prevents sharp from emitting a greyscale JPEG
 * when the WebP's internal colorspace metadata says 'greyscale'.
 */
async function webpToJpeg(data: Buffer): Promise<Buffer> {
  return Buffer.from(
    await sharp(data)
      .flatten({ background: '#ffffff' })
      .toColorspace('srgb')
      .jpeg({ quality: 92 })
      .toBuffer(),
  );
}

export async function buildEpub(opts: EpubChapterOptions): Promise<void> {
  const { imageFiles, outputPath, seriesTitle, chapterTitle, chapterNumber } = opts;

  const title = chapterTitle ?? path.basename(outputPath, '.epub');
  const tempCbz = `${outputPath}.tmp.cbz`;
  const processedFiles: string[] = [];

  // Normalise images: convert any WebP files to JPEG so Calibre receives
  // proper color images and skips its greyscale conversion path.
  for (const f of imageFiles) {
    const data = await readFile(f);
    if (isWebP(data)) {
      const jpegPath = f.replace(/\.[^.]+$/, '.jpg');
      await writeFile(jpegPath, await webpToJpeg(data));
      processedFiles.push(jpegPath);
    } else {
      processedFiles.push(f);
    }
  }

  const zip = new AdmZip();
  for (const f of processedFiles) {
    zip.addLocalFile(f);
  }
  zip.writeZip(tempCbz);

  // Remove any temp JPEG files we created alongside the originals.
  const tempJpegs = processedFiles.filter((f, i) => f !== imageFiles[i]);

  try {
    const args: string[] = [tempCbz, outputPath];

    args.push('--title', title);
    if (seriesTitle) args.push('--series', seriesTitle);
    if (chapterNumber != null) args.push('--series-index', String(chapterNumber));

    // 'tablet' profile = 2560×1600 — large enough to avoid Calibre downscaling manga images.
    args.push('--output-profile', 'tablet');
    // Calibre's comic pipeline converts images to grayscale by default; disable it.
    args.push('--dont-grayscale');

    await execFileAsync('ebook-convert', args, { timeout: 180_000 });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error(
        'ebook-convert not found. Install Calibre (https://calibre-ebook.com) and ensure it is on PATH.',
      );
    }
    throw err;
  } finally {
    await rm(tempCbz, { force: true });
    await Promise.all(tempJpegs.map(f => rm(f, { force: true })));
  }
}
