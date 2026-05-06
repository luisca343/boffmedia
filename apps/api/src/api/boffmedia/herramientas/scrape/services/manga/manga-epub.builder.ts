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

export interface EpubMetadata {
  title?: string;
  language?: string;
  author?: string;
  authorSort?: string;
  illustrator?: string;
  illustratorSort?: string;
  publisher?: string;
  date?: string;
  subjects?: string[];
}

export interface EpubChapterOptions {
  /** Absolute paths to image files, in display order. */
  imageFiles: string[];
  /** Full output path including .epub extension. */
  outputPath: string;
  seriesTitle?: string;
  chapterTitle?: string;
  chapterNumber?: number | null;
  /**
   * When true, uses the first image as the EPUB cover page.
   * When false (default), suppresses Calibre's auto-generated title page entirely.
   */
  includeCover?: boolean;
  /** Optional metadata injected into the EPUB OPF after Calibre conversion. */
  metadata?: EpubMetadata;
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

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Opens the EPUB (a ZIP file), finds the OPF via container.xml, replaces the
 * dc: metadata with the provided values, and preserves Calibre's <meta> elements
 * (cover reference, series info, etc.).  Best-effort — errors are silently swallowed
 * so a malformed EPUB is never caused by this step.
 */
export async function injectEpubMetadata(epubPath: string, meta: EpubMetadata): Promise<void> {
  const hasContent = Object.values(meta).some(v => (Array.isArray(v) ? v.length > 0 : !!v));
  if (!hasContent) return;

  try {
    const zip = new AdmZip(epubPath);

    const container = zip.readAsText('META-INF/container.xml');
    const opfPathMatch = container.match(/full-path="([^"]+)"/);
    if (!opfPathMatch) return;
    const opfPath = opfPathMatch[1];

    let opf = zip.readAsText(opfPath);

    // Preserve the unique book identifier and all <meta .../> elements.
    const identifierMatch = opf.match(/<dc:identifier[\s\S]*?<\/dc:identifier>/i);
    const metaElements = [...opf.matchAll(/<meta\b[^>]*\/?>/gi)].map(m => m[0]);

    const lines: string[] = [];
    if (identifierMatch) lines.push(identifierMatch[0]);
    if (meta.title)       lines.push(`<dc:title>${escapeXml(meta.title)}</dc:title>`);
    if (meta.language)    lines.push(`<dc:language>${escapeXml(meta.language)}</dc:language>`);
    if (meta.author) {
      const fileAs = meta.authorSort || meta.author;
      lines.push(`<dc:creator opf:role="aut" opf:file-as="${escapeXml(fileAs)}">${escapeXml(meta.author)}</dc:creator>`);
    }
    if (meta.illustrator) {
      const fileAs = meta.illustratorSort || meta.illustrator;
      lines.push(`<dc:creator opf:role="ill" opf:file-as="${escapeXml(fileAs)}">${escapeXml(meta.illustrator)}</dc:creator>`);
    }
    if (meta.publisher)   lines.push(`<dc:publisher>${escapeXml(meta.publisher)}</dc:publisher>`);
    if (meta.date)        lines.push(`<dc:date>${escapeXml(meta.date)}</dc:date>`);
    for (const s of meta.subjects ?? []) {
      if (s.trim()) lines.push(`<dc:subject>${escapeXml(s.trim())}</dc:subject>`);
    }
    lines.push(...metaElements);

    const newMetadata = [
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">',
      ...lines.map(l => `    ${l}`),
      '  </metadata>',
    ].join('\n');

    const updated = opf.replace(/<metadata\b[\s\S]*?<\/metadata>/i, newMetadata);
    if (updated === opf) return;

    zip.updateFile(opfPath, Buffer.from(updated, 'utf-8'));
    zip.writeZip(epubPath);
  } catch {
    // Best-effort: do not fail the conversion if metadata injection errors.
  }
}

export async function buildEpub(opts: EpubChapterOptions): Promise<void> {
  const { imageFiles, outputPath, seriesTitle, chapterTitle, chapterNumber, includeCover } = opts;

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

    if (includeCover && processedFiles.length > 0) {
      // Use the first manga page as the EPUB cover image.
      args.push('--cover', processedFiles[0]);
    } else {
      // Prevent Calibre from generating a text-based title page from metadata.
      args.push('--no-default-epub-cover');
    }

    await execFileAsync('ebook-convert', args, { timeout: 180_000 });
    if (opts.metadata) await injectEpubMetadata(outputPath, opts.metadata);
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
