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
import { laboonPath } from '@/config/paths';
import { DesktopRelease } from '@/_db/schema/DesktopReleases';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';
import {
  DesktopDownloadEntity,
  DesktopReleaseEntity,
  UpdaterFeedEntity,
} from './entities/desktop-updates.entity';

export interface ClientIdentifier {
  /** A stable identifier for the client (device id, installation id, or machine UUID). */
  deviceId: string;
}

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
   *
   * Honors staged rollout: a release at N% is offered only to a deterministic,
   * stable subset of clients (bucketed by hashing the device ID). A paused
   * release is never offered, even if published.
   */
  async feed(
    target: string,
    currentVersion: string,
    baseUrl: string,
    clientId?: ClientIdentifier,
  ): Promise<UpdaterFeedEntity | null> {
    const platform = this.assertTarget(target);
    const releases = await this.releases.listPublishedForTarget(platform);
    const newest = this.newest(
      releases.filter((r) => !r.paused && this.isClientInRollout(r, clientId)),
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

  /**
   * Deterministically assign a client to a rollout bucket based on their device ID.
   * Returns true if the client is in the rollout percentage for this release.
   *
   * The bucket assignment is stable: the same device ID will always get the same
   * answer across repeated calls, and the population splits evenly across buckets
   * at the specified percentage.
   */
  private isClientInRollout(
    release: DesktopRelease,
    clientId?: ClientIdentifier,
  ): boolean {
    // No client identifier means we can't determine rollout; conservative default
    // is to include it (assume it's a new install or dev client that should get
    // the release). For production, the desktop app should always send device_id.
    if (!clientId) return true;

    // If rollout is at 100%, everyone gets it.
    if (release.rolloutPercent >= 100) return true;

    // If rollout is at 0%, no one gets it.
    if (release.rolloutPercent <= 0) return false;

    // Hash the device ID to a stable 0-99 bucket.
    const bucket = this.getClientBucket(clientId.deviceId);
    return bucket < release.rolloutPercent;
  }

  /**
   * Hash a device ID to a stable bucket (0-99). Uses CRC32-style hashing for
   * determinism across clients and requests.
   */
  private getClientBucket(deviceId: string): number {
    // Use a simple hash based on the device ID to map it to 0-99.
    // This ensures the same device always gets the same bucket.
    const hash = createHash('sha256').update(deviceId).digest();
    // Take the first 4 bytes and convert to a number in the range 0-99.
    const value = hash.readUInt32BE(0);
    return Math.abs(value % 100);
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

  async setRolloutPercent(
    id: number,
    rolloutPercent: number,
  ): Promise<DesktopReleaseEntity> {
    const row = await this.releases.findById(id);
    if (!row) throw new NotFoundException('Release no encontrada');
    if (rolloutPercent < 0 || rolloutPercent > 100) {
      throw new BadRequestException({
        message: 'rolloutPercent must be between 0 and 100',
        userMessage: 'El porcentaje de despliegue debe estar entre 0 y 100.',
      });
    }
    await this.releases.setRolloutPercent(id, rolloutPercent);
    return toEntity({ ...row, rolloutPercent });
  }

  async setPaused(id: number, paused: boolean): Promise<DesktopReleaseEntity> {
    const row = await this.releases.findById(id);
    if (!row) throw new NotFoundException('Release no encontrada');
    await this.releases.setPaused(id, paused);
    return toEntity({ ...row, paused });
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
    rolloutPercent: row.rolloutPercent,
    paused: row.paused,
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
