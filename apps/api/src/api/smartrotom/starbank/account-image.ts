import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { mkdir, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Account profile pictures.
 *
 * **The file is named after the account id, never after anything the user typed.** Saving it as
 * `<account name>.<ext>` has two faults: two players who both call an account "Ahorros" silently
 * overwrite each other's picture, and the name goes unsanitised into a path, so `../../` escapes
 * the upload directory entirely (the 40-character limit is client-side only).
 *
 * The extension comes from the *mimetype* multer already validated, not from the uploaded
 * filename — that is the other half of the same hole.
 */

/** Relative to the API's CWD. `apps/api/public` is a junction to the shared root `public/`. */
export const ACCOUNT_IMAGE_DIR = join(
  'public',
  'smartrotom',
  'img',
  'apps',
  'starbank',
  'cuentas',
);

/** What the browser requests — the web root, not the disk path. */
export const ACCOUNT_IMAGE_PUBLIC_PATH =
  '/smartrotom/img/apps/starbank/cuentas';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Multer options shared by create and update.
 *
 * `memoryStorage`, not `diskStorage`: the filename has to be the account id, and on create that
 * id does not exist until after the row is inserted. Holding at most 5 MB in memory is cheaper
 * than writing a temporary file and renaming it, and it means a failed insert leaves nothing on
 * disk to clean up.
 */
export const ACCOUNT_IMAGE_UPLOAD = {
  storage: memoryStorage(),
  // The destination is web-served static, so an unbounded or non-image upload is a storage and
  // abuse vector.
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (EXTENSION_BY_MIMETYPE[file.mimetype]) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Unsupported image format. Use jpg, jpeg, png, gif or webp.',
        ),
        false,
      );
    }
  },
};

/**
 * Writes the picture and returns the path to store on the account row.
 *
 * The URL carries a `?v=` stamp because the filename is stable: without it a replaced picture
 * keeps its old URL and every browser that has seen the account goes on showing the previous
 * image until its cache expires.
 */
export async function saveAccountImage(
  accountId: number,
  file: { buffer: Buffer; mimetype: string },
): Promise<string> {
  const extension = EXTENSION_BY_MIMETYPE[file.mimetype];
  if (!extension) {
    throw new BadRequestException(
      'Unsupported image format. Use jpg, jpeg, png, gif or webp.',
    );
  }

  await mkdir(ACCOUNT_IMAGE_DIR, { recursive: true });
  await removeOtherFormats(accountId, extension);
  await writeFile(
    join(ACCOUNT_IMAGE_DIR, `${accountId}.${extension}`),
    file.buffer,
  );

  return `${ACCOUNT_IMAGE_PUBLIC_PATH}/${accountId}.${extension}?v=${Date.now()}`;
}

// A png replaced by a webp would otherwise leave the png behind forever: nothing points at it,
// and its name collides with nothing, so it would never be noticed or reclaimed.
async function removeOtherFormats(
  accountId: number,
  keepExtension: string,
): Promise<void> {
  try {
    const entries = await readdir(ACCOUNT_IMAGE_DIR);
    const stale = entries.filter(
      (entry) =>
        entry.startsWith(`${accountId}.`) &&
        entry !== `${accountId}.${keepExtension}`,
    );
    await Promise.all(
      stale.map((entry) => unlink(join(ACCOUNT_IMAGE_DIR, entry))),
    );
  } catch {
    // Housekeeping only — a stale file must never fail the upload that replaced it.
  }
}
