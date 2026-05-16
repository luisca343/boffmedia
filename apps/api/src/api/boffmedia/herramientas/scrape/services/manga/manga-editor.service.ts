import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { mkdir, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { ChapterPageInfo } from './manga.types';
import { MANGA_ROOT } from './manga-constants';
import {
  buildEpub,
  injectEpubMetadata,
  type EpubMetadata,
} from './manga-epub.builder';

const IMAGE_RE = /\.(webp|jpg|jpeg|png|gif)$/i;
const COMIC_INFO_RE = /^ComicInfo\.xml$/i;

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function mimeFor(filename: string): string {
  return MIME_MAP[path.extname(filename).toLowerCase()] ?? 'image/jpeg';
}

/** Assert the resolved path is inside MANGA_ROOT to prevent path traversal. */
function assertSafe(resolved: string): void {
  const root = path.resolve(MANGA_ROOT);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new NotFoundException('Chapter not found');
  }
}

/** Extract the chapter title from ComicInfo.xml inside a zip, or return undefined. */
function readComicInfoTitle(zip: AdmZip): string | undefined {
  const entry = zip.getEntries().find((e) => COMIC_INFO_RE.test(e.name));
  if (!entry) return undefined;
  try {
    const xml = zip.readAsText(entry);
    const match = xml.match(/<Title>([^<]+)<\/Title>/i);
    return match ? match[1].trim() || undefined : undefined;
  } catch {
    return undefined;
  }
}

/** Return sorted image entries from an open AdmZip. */
function sortedImageEntries(zip: AdmZip) {
  return zip
    .getEntries()
    .filter((e) => !e.isDirectory && IMAGE_RE.test(e.name))
    .sort((a, b) =>
      a.entryName.localeCompare(b.entryName, undefined, { numeric: true }),
    );
}

@Injectable()
export class MangaEditorService {
  /** List all pages in a chapter (CBZ preferred; falls back to EPUB). */
  async getChapterPageList(
    series: string,
    chapter: string,
  ): Promise<ChapterPageInfo[]> {
    const archivePath = this.resolveArchive(series, chapter);
    const zip = this.openArchive(archivePath);
    return sortedImageEntries(zip).map((entry, index) => ({
      index,
      filename: entry.name,
      mimeType: mimeFor(entry.name),
    }));
  }

  /** Stream raw bytes for a single page image. */
  async serveChapterImage(
    series: string,
    chapter: string,
    page: number,
    res: Response,
  ): Promise<void> {
    const archivePath = this.resolveArchive(series, chapter);
    const zip = this.openArchive(archivePath);
    const entries = sortedImageEntries(zip);

    if (page < 0 || page >= entries.length) {
      throw new NotFoundException(`Page ${page} not found`);
    }

    const entry = entries[page];
    const data = zip.readFile(entry);
    if (!data) throw new NotFoundException(`Could not read page ${page}`);

    res.setHeader('Content-Type', mimeFor(entry.name));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(data);
  }

  /**
   * Extract non-excluded pages from a CBZ, build an EPUB, and return its path.
   * The original CBZ is left untouched.
   */
  async convertChapter(
    series: string,
    chapter: string,
    excludePages: number[],
    includeCover?: boolean,
    metadata?: EpubMetadata,
  ): Promise<{ outputPath: string }> {
    const archivePath = this.resolveArchive(series, chapter);
    const zip = this.openArchive(archivePath);
    const entries = sortedImageEntries(zip);

    const excluded = new Set(excludePages);
    const kept = entries.filter((_, i) => !excluded.has(i));

    if (kept.length === 0) {
      throw new NotFoundException('No pages remain after exclusion');
    }

    const seriesDir = path.join(MANGA_ROOT, series);
    const epubPath = path.join(seriesDir, `${chapter}.epub`);
    const tempDir = `${epubPath}.convert.tmp`;

    await mkdir(tempDir, { recursive: true });
    const imageFiles: string[] = [];

    try {
      for (let i = 0; i < kept.length; i++) {
        const entry = kept[i];
        const data = zip.readFile(entry);
        if (!data) continue;
        const ext = path.extname(entry.name) || '.jpg';
        const dest = path.join(
          tempDir,
          `${String(i + 1).padStart(3, '0')}${ext}`,
        );
        await writeFile(dest, data);
        imageFiles.push(dest);
      }

      // Prefer title from ComicInfo.xml over the slug; user metadata overrides both
      const comicInfoTitle = readComicInfoTitle(zip);

      await buildEpub({
        imageFiles,
        outputPath: epubPath,
        seriesTitle: series,
        chapterTitle: comicInfoTitle ?? chapter,
        chapterNumber: parseFloat(chapter) || null,
        includeCover,
        metadata,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    return { outputPath: epubPath };
  }

  async patchEpubMetadata(
    series: string,
    chapter: string,
    metadata: EpubMetadata,
  ): Promise<{ updated: boolean }> {
    const epubPath = path.resolve(MANGA_ROOT, series, `${chapter}.epub`);
    assertSafe(epubPath);
    try {
      new AdmZip(epubPath);
    } catch {
      return { updated: false };
    }
    await injectEpubMetadata(epubPath, metadata);
    return { updated: true };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private resolveArchive(series: string, chapter: string): string {
    const cbz = path.resolve(MANGA_ROOT, series, `${chapter}.cbz`);
    assertSafe(cbz);
    const epub = path.resolve(MANGA_ROOT, series, `${chapter}.epub`);
    assertSafe(epub);

    // Prefer CBZ; fall back to EPUB.
    try {
      new AdmZip(cbz);
      return cbz;
    } catch {
      try {
        new AdmZip(epub);
        return epub;
      } catch {
        throw new NotFoundException(
          `Chapter "${chapter}" not found in series "${series}"`,
        );
      }
    }
  }

  private resolveCbz(series: string, chapter: string): string {
    const cbz = path.resolve(MANGA_ROOT, series, `${chapter}.cbz`);
    assertSafe(cbz);
    try {
      new AdmZip(cbz);
      return cbz;
    } catch {
      throw new NotFoundException(
        `CBZ for chapter "${chapter}" not found — cannot convert`,
      );
    }
  }

  private openArchive(archivePath: string): AdmZip {
    try {
      return new AdmZip(archivePath);
    } catch {
      throw new NotFoundException('Archive could not be opened');
    }
  }
}
