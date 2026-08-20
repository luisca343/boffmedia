import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, rename, rm, stat } from 'fs/promises';
import { basename, dirname, join } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { laboonPath } from '@/config/laboon';
import { DesktopRelease } from '@/_db/schema/DesktopReleases';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';
import {
  DesktopDownloadEntity,
  DesktopReleaseEntity,
  UpdaterFeedEntity,
} from './entities/desktop-updates.entity';

/** Tauri's platform key is `{os}-{arch}`: windows-x86_64, darwin-aarch64,
 *  linux-x86_64… Anything else is a client typo, and this value becomes a path
 *  segment, so it is validated before it ever reaches the filesystem. */
const TARGET_RE = /^[a-z0-9]+-[a-z0-9_]+$/;

/** Semver-ish. Tauri strips a leading `v`; we never store one. */
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export interface ArtifactStream {
  stream: Readable;
  contentLength: number;
  filename: string;
}

@Injectable()
export class DesktopUpdatesService {
  private readonly logger = new Logger(DesktopUpdatesService.name);

  constructor(private readonly releases: DesktopReleasesRepository) {}

  // ── The updater feed ─────────────────────────────────────────────────────

  /**
   * The document Tauri v2's updater plugin expects. Returns null when the
   * caller is already on the newest published build — the plugin treats an
   * empty 204 as "no update", which is cheaper and less error-prone than
   * returning a payload it has to reject.
   */
  async feed(
    target: string,
    currentVersion: string,
    baseUrl: string,
  ): Promise<UpdaterFeedEntity | null> {
    const platform = this.assertTarget(target);
    const newest = this.newest(
      await this.releases.listPublishedForTarget(platform),
    );
    if (!newest) return null;
    if (compareVersions(newest.version, stripV(currentVersion)) <= 0)
      return null;

    return {
      version: newest.version,
      notes: newest.notes ?? '',
      pub_date: (newest.publishedAt ?? newest.createdAt).toISOString(),
      platforms: {
        [platform]: {
          signature: newest.signature,
          url: `${baseUrl}/desktop/updates/download/${newest.version}/${platform}`,
        },
      },
    };
  }

  /** Newest *published* build for a target, by semver, not by insert order. */
  private newest(rows: DesktopRelease[]): DesktopRelease | null {
    return rows.reduce<DesktopRelease | null>(
      (best, row) =>
        best === null || compareVersions(row.version, best.version) > 0
          ? row
          : best,
      null,
    );
  }

  // ── Public download listing ──────────────────────────────────────────────

  /**
   * The newest published build per target, for the public download page.
   *
   * Deliberately NOT the updater feed: that one is keyed by the caller's current
   * version and returns 204 once you are up to date, which would make the page
   * empty for anyone who already has the launcher. This always lists whatever is
   * newest, and adds the size/hash the feed has no reason to carry.
   */
  async downloads(baseUrl: string): Promise<DesktopDownloadEntity[]> {
    const byTarget = new Map<string, DesktopRelease>();
    for (const row of await this.releases.listPublished()) {
      const best = byTarget.get(row.target);
      if (!best || compareVersions(row.version, best.version) > 0) {
        byTarget.set(row.target, row);
      }
    }

    return [...byTarget.values()]
      .sort((a, b) => a.target.localeCompare(b.target))
      .map((row) => ({
        target: row.target,
        version: row.version,
        artifactName: row.artifactName,
        url: `${baseUrl}/desktop/updates/download/${row.version}/${row.target}`,
        sha512: row.artifactSha512,
        sizeBytes: row.sizeBytes,
        notes: row.notes,
        publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
      }));
  }

  // ── Artifact bytes ───────────────────────────────────────────────────────

  async artifact(version: string, target: string): Promise<ArtifactStream> {
    const row = await this.releases.findByVersionTarget(
      this.assertVersion(version),
      this.assertTarget(target),
    );
    if (!row || !row.published) {
      throw new NotFoundException({
        message: `app release ${version}/${target} is not published`,
        userMessage: 'Esa versión de la app no está disponible.',
      });
    }

    const path = artifactPath(row.version, row.target, row.artifactName);
    const size = await stat(path).then(
      (s) => s.size,
      () => null,
    );
    if (size === null) {
      // A published row whose bytes are gone is an operator problem; say so in
      // the log, because the launcher will only ever see a 404.
      this.logger.error(
        `Falta en disco el artefacto ${row.version}/${row.target}`,
      );
      throw new NotFoundException({
        message: `artifact for ${row.version}/${row.target} is missing on disk`,
        userMessage: 'Esa versión de la app no está disponible.',
      });
    }

    return {
      stream: createReadStream(path),
      contentLength: size,
      filename: row.artifactName,
    };
  }

  // ── Publishing ───────────────────────────────────────────────────────────

  /**
   * Ingest a release artifact. The bytes arrive as a raw octet-stream body —
   * `express.json()` is content-type gated, so nothing has consumed the request
   * and it streams straight to disk. Same temp-file-then-rename dance as the
   * pack blobs: a half-written artifact under its final name would be served,
   * fail signature verification on every machine at once, and look like a
   * compromised key rather than a dropped upload.
   */
  async publishArtifact(
    source: Readable,
    input: {
      version: string;
      target: string;
      signature: string;
      notes: string | null;
      filename: string;
    },
    actorId: number | null,
  ): Promise<DesktopReleaseEntity> {
    const version = this.assertVersion(input.version);
    const target = this.assertTarget(input.target);
    // basename() and not a regex: the file name comes from a header and would
    // otherwise be a path traversal straight out of the release directory.
    const filename = basename(input.filename).replace(/[^A-Za-z0-9._-]/g, '_');
    if (!filename || filename.startsWith('.')) {
      throw new BadRequestException({
        message: 'invalid artifact filename',
        userMessage: 'El nombre del archivo no es válido.',
      });
    }
    if (!input.signature.trim()) {
      throw new BadRequestException({
        message: 'missing updater signature',
        userMessage: 'Falta la firma del actualizador.',
      });
    }

    const dir = releaseDir();
    await mkdir(join(dir, 'tmp'), { recursive: true });
    const temp = join(dir, 'tmp', `${randomUUID()}.part`);

    const hash = createHash('sha512');
    let size = 0;
    source.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      size += chunk.length;
    });

    try {
      await pipeline(source, createWriteStream(temp));
    } catch (error: unknown) {
      await rm(temp, { force: true });
      throw new BadRequestException({
        message: `artifact upload failed: ${error instanceof Error ? error.message : String(error)}`,
        userMessage: 'La subida se ha interrumpido. Inténtalo de nuevo.',
      });
    }

    if (size === 0) {
      await rm(temp, { force: true });
      throw new BadRequestException({
        message: 'empty artifact upload',
        userMessage: 'El archivo está vacío.',
      });
    }

    const path = artifactPath(version, target, filename);
    await mkdir(dirname(path), { recursive: true });
    await rename(temp, path);

    await this.releases.upsert({
      version,
      target,
      signature: input.signature.trim(),
      notes: input.notes,
      artifactName: filename,
      artifactSha512: hash.digest('hex'),
      sizeBytes: size,
      uploadedBy: actorId,
    });

    const row = await this.releases.findByVersionTarget(version, target);
    return toEntity(row!);
  }

  async list(): Promise<DesktopReleaseEntity[]> {
    return (await this.releases.listAll()).map(toEntity);
  }

  async setPublished(
    id: number,
    published: boolean,
  ): Promise<DesktopReleaseEntity> {
    const row = await this.releases.findById(id);
    if (!row) throw new NotFoundException('Release no encontrada');
    await this.releases.setPublished(id, published);
    return toEntity({
      ...row,
      published,
      publishedAt: published ? new Date() : null,
    });
  }

  async remove(id: number): Promise<void> {
    const row = await this.releases.findById(id);
    if (!row) throw new NotFoundException('Release no encontrada');
    await this.releases.remove(id);
    await rm(artifactPath(row.version, row.target, row.artifactName), {
      force: true,
    });
  }

  private assertTarget(target: string): string {
    const value = target.toLowerCase();
    if (!TARGET_RE.test(value)) {
      throw new BadRequestException({
        message: `invalid tauri target "${target}"`,
        userMessage: 'Plataforma no reconocida.',
      });
    }
    return value;
  }

  private assertVersion(version: string): string {
    const value = stripV(version);
    if (!VERSION_RE.test(value)) {
      throw new BadRequestException({
        message: `invalid version "${version}"`,
        userMessage: 'La versión no es válida.',
      });
    }
    return value;
  }
}

function toEntity(row: DesktopRelease): DesktopReleaseEntity {
  return {
    id: row.id,
    version: row.version,
    target: row.target,
    notes: row.notes,
    artifactName: row.artifactName,
    artifactSha512: row.artifactSha512,
    sizeBytes: row.sizeBytes,
    published: row.published,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function releaseDir(): string {
  return laboonPath('desktop-releases');
}

/** `<dir>/<version>/<target>/<artifactName>` — one directory per release so an
 *  operator can drop or archive a whole version by hand. Every segment is
 *  validated by the caller; nothing here re-derives a path from user input. */
function artifactPath(
  version: string,
  target: string,
  filename: string,
): string {
  return join(releaseDir(), version, target, filename);
}

function stripV(version: string): string {
  return version.trim().replace(/^v/i, '');
}

/** -1 / 0 / 1. Pre-release builds sort BELOW their release (1.2.0-rc1 < 1.2.0),
 *  which is what keeps an rc from being offered as an update to the final. */
function compareVersions(a: string, b: string): number {
  const [aCore, aPre] = splitPre(a);
  const [bCore, bPre] = splitPre(b);

  for (let i = 0; i < 3; i += 1) {
    const diff = (aCore[i] ?? 0) - (bCore[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  if (aPre === bPre) return 0;
  if (!aPre) return 1;
  if (!bPre) return -1;
  return aPre > bPre ? 1 : -1;
}

function splitPre(version: string): [number[], string] {
  const [core, ...rest] = version.split('-');
  return [
    core.split('.').map((n) => Number.parseInt(n, 10) || 0),
    rest.join('-'),
  ];
}
