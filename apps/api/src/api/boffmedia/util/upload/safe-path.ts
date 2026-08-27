import { BadRequestException } from '@nestjs/common';
import { basename, resolve, sep } from 'path';

import { uploadsPath } from '@/config/paths';

/**
 * Path safety for the upload module.
 *
 * These are plain functions, not repository methods, because multer's
 * `diskStorage` callbacks are static configuration on the controller — they run
 * outside Nest's DI *and* before the global `ValidationPipe`, so a DTO
 * constraint cannot protect them. Every guard here therefore has to be callable
 * from that context.
 *
 * The attack this closes: multer writes to `join(destination, filename)` the
 * moment the body streams in. A `filename` of `../../../public/evil.html` put
 * the bytes outside the uploads root immediately. `validateFilename()` in
 * FileUploadService *does* reject a filename containing a separator, but it runs
 * afterwards and throws — so the rename that would have pulled the file back
 * into the root never happened, and the attacker's file stayed where it landed.
 *
 * `..` is the only real escape: `join(root, '/etc/passwd')` yields
 * `root/etc/passwd`, so an absolute segment is harmless. Both are rejected
 * anyway, and `assertWithinUploads` re-checks the resolved result so a future
 * edit to either regex cannot silently reopen the hole.
 */

/**
 * A subdirectory under the uploads root: lowercase segments, at most four deep.
 * Dots are excluded entirely, which is what makes `..` unrepresentable rather
 * than merely filtered.
 */
const SUBDIR_RE = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*){0,3}$/;

/** A single filename: no separators, no leading dot, one extension. */
const FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;

/** Extensions we are willing to write, whatever the client claims. */
export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]);

export const ALLOWED_FILE_EXTENSIONS = new Set([
  ...ALLOWED_IMAGE_EXTENSIONS,
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.zip',
  '.log',
]);

/** Magic-byte prefixes, so a `.png` that is really a script is refused. */
const IMAGE_MAGIC: ReadonlyArray<{ ext: string; test: (b: Buffer) => boolean }> =
  [
    { ext: '.jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    {
      ext: '.png',
      test: (b) =>
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
    },
    {
      ext: '.gif',
      test: (b) => b.subarray(0, 3).toString('latin1') === 'GIF',
    },
    {
      ext: '.webp',
      test: (b) =>
        b.subarray(0, 4).toString('latin1') === 'RIFF' &&
        b.subarray(8, 12).toString('latin1') === 'WEBP',
    },
  ];

/** Multipart fields arrive as `string | string[]`; take the first value. */
function first(raw: unknown): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Validates a client-supplied subdirectory. Returns `undefined` for "no
 * subdirectory" and throws on anything that is not a plain relative path.
 */
export function safeSubdir(raw: unknown): string | undefined {
  const value = first(raw);
  if (!value) return undefined;

  if (!SUBDIR_RE.test(value)) {
    throw new BadRequestException(
      'Invalid upload path: use lowercase folder names such as "profiles" or "blog/images"',
    );
  }
  return value;
}

/**
 * Derives the name to write. A client name is kept when it is already safe —
 * the web sends `${userId}-${Date.now()}.jpg` and callers read the returned
 * `url`, so preserving it costs nothing — but it is reduced to a bare basename
 * first and must carry an allowed extension. Anything else gets a generated
 * name rather than an error, so a caller with an odd filename still succeeds.
 */
export function safeFilename(
  raw: unknown,
  originalName: string,
  allowed: ReadonlySet<string> = ALLOWED_FILE_EXTENSIONS,
): string {
  const requested = first(raw);

  if (requested) {
    // basename() strips every directory component, so "../../x.png" -> "x.png".
    const bare = basename(requested);
    if (
      bare !== requested ||
      !FILENAME_RE.test(bare) ||
      bare.includes('..') ||
      !allowed.has(extensionOf(bare))
    ) {
      throw new BadRequestException(
        'Invalid filename: use letters, digits, dot, dash or underscore, with an allowed extension',
      );
    }
    return bare;
  }

  const ext = extensionOf(basename(originalName ?? ''));
  const safeExt = allowed.has(ext) ? ext : '.bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}

/**
 * Validates a filename that names an *existing* file (delete, info). Structure
 * only — no extension allowlist, because files written before that allowlist
 * existed must stay addressable. Rejecting separators and `..` is what matters
 * here: `deleteFile` used to join this straight onto the upload directory with
 * no validation at all, which made any file the process could reach deletable.
 */
export function safeExistingFilename(raw: unknown): string {
  const value = first(raw);
  if (!value) {
    throw new BadRequestException('Filename is required');
  }

  const bare = basename(value);
  if (bare !== value || !FILENAME_RE.test(bare) || bare.includes('..')) {
    throw new BadRequestException('Invalid filename');
  }
  return bare;
}

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/**
 * Resolves `<uploads root>/<subdir>/<filename>` and refuses to return anything
 * that escapes the root. The final containment check on the *resolved* path is
 * the backstop: even if a regex above is loosened later, nothing outside the
 * root can be produced here.
 */
export function resolveWithinUploads(
  subdir?: string,
  filename?: string,
): string {
  const root = resolve(uploadsPath());
  const segments = [root, subdir, filename].filter(
    (segment): segment is string => Boolean(segment),
  );
  const target = resolve(...segments);

  if (target !== root && !target.startsWith(root + sep)) {
    throw new BadRequestException('Invalid upload location');
  }
  return target;
}

/** Throws unless `candidate` is inside the uploads root. */
export function assertWithinUploads(candidate: string): string {
  const root = resolve(uploadsPath());
  const target = resolve(candidate);

  if (target !== root && !target.startsWith(root + sep)) {
    throw new BadRequestException('Invalid upload location');
  }
  return target;
}

/**
 * Confirms the bytes are actually the image type the extension claims. Called
 * after the file is on disk (multer streams it) but before it is accepted, so a
 * mismatch is deleted rather than served.
 */
export function sniffImageExtension(head: Buffer): string | null {
  for (const candidate of IMAGE_MAGIC) {
    if (candidate.test(head)) return candidate.ext;
  }
  return null;
}

/** `.jpg` and `.jpeg` are the same bytes; treat them as one. */
export function extensionMatchesSniff(ext: string, sniffed: string): boolean {
  const normalise = (value: string) => (value === '.jpeg' ? '.jpg' : value);
  return normalise(ext) === normalise(sniffed);
}
