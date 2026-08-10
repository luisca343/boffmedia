import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, rename, rm, stat } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { firstValueFrom } from 'rxjs';
import { env } from '@/config/env';
import { laboonPath } from '@/config/laboon';

// HANDOFF §4.5 — every CurseForge byte is proxied. The key stays here because an
// embedded key is an extracted key, and an abused key is a revoked key, which
// would break the launcher for every user at once. Modrinth and plain URLs are
// NOT proxied: they need no key and the egress would be ours for nothing.

const CF_API = 'https://api.curseforge.com/v1';

/** An unbounded raw-body upload can fill the laboon volume, which also hosts
 *  launcher releases. Checked as the bytes stream in, never after. */
const MAX_BLOB_BYTES = 512 * 1024 * 1024;

/** §3.2 / §10 — as of 16 July 2026 `edge.forgecdn.net` answers 401 to any
 *  request without this header. It is a header, never a query parameter; any
 *  recipe older than mid-2026 is broken on exactly this. */
const CF_KEY_HEADER = 'x-api-key';

export interface ProxiedDownload {
  stream: Readable;
  contentType: string;
  contentLength: number | null;
  filename: string;
}

@Injectable()
export class PacksDownloadsService {
  private readonly logger = new Logger(PacksDownloadsService.name);

  constructor(private readonly http: HttpService) {}

  private get curseforgeKey(): string {
    if (!env.CURSEFORGE_API_KEY) {
      // A missing key is an operator problem, not a client one — say so as a 503
      // rather than letting it surface as an opaque 401 from the CDN.
      throw new ServiceUnavailableException({
        message: 'CURSEFORGE_API_KEY is not configured',
        userMessage:
          'El servidor no puede descargar archivos de CurseForge ahora mismo. Avisa a un administrador.',
      });
    }
    return env.CURSEFORGE_API_KEY;
  }

  /** Resolve the real CDN URL server-side and stream the bytes back. */
  async curseforge(
    projectId: number,
    fileId: number,
  ): Promise<ProxiedDownload> {
    const key = this.curseforgeKey;
    const url = await this.resolveCurseforgeUrl(projectId, fileId, key);

    const response = await firstValueFrom(
      this.http.get<Readable>(url, {
        responseType: 'stream',
        // The CDN itself needs the key too, not just the API host (§10).
        headers: { [CF_KEY_HEADER]: key },
        timeout: 30_000,
        maxRedirects: 5,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(
        `CDN de CurseForge inalcanzable (${url}): ${asMessage(error)}`,
      );
      throw new BadGatewayException({
        message: 'curseforge cdn unreachable',
        userMessage:
          'No se ha podido contactar con CurseForge. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      // Documented failure mode: the key was rejected or was not sent. Never a
      // client fault, so never a 4xx to the launcher.
      this.logger.error(
        `edge.forgecdn.net devolvió ${response.status} para ${projectId}/${fileId} — clave rechazada o ausente`,
      );
      throw new ServiceUnavailableException({
        message: `curseforge cdn rejected the api key (${response.status})`,
        userMessage:
          'CurseForge ha rechazado la clave del servidor. Avisa a un administrador.',
      });
    }
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `curseforge cdn returned ${response.status}`,
        userMessage: 'CurseForge no ha devuelto el archivo.',
      });
    }

    const length = Number(response.headers['content-length']);
    return {
      stream: response.data,
      contentType:
        (response.headers['content-type'] as string | undefined) ??
        'application/octet-stream',
      contentLength: Number.isFinite(length) ? length : null,
      filename: decodeURIComponent(url.split('/').pop() ?? `${fileId}.jar`),
    };
  }

  /** The CDN URL alone, without streaming it. The catalog service hashes the
   *  bytes itself, so it needs the URL but not this class's response handling. */
  async curseforgeDownloadUrl(
    projectId: number,
    fileId: number,
  ): Promise<string> {
    return this.resolveCurseforgeUrl(projectId, fileId, this.curseforgeKey);
  }

  private async resolveCurseforgeUrl(
    projectId: number,
    fileId: number,
    key: string,
  ): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<{ data?: string | null }>(
        `${CF_API}/mods/${projectId}/files/${fileId}/download-url`,
        {
          headers: { [CF_KEY_HEADER]: key, accept: 'application/json' },
          timeout: 15_000,
          validateStatus: () => true,
        },
      ),
    ).catch((error: unknown) => {
      this.logger.error(`API de CurseForge inalcanzable: ${asMessage(error)}`);
      throw new BadGatewayException({
        message: 'curseforge api unreachable',
        userMessage:
          'No se ha podido contactar con CurseForge. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `API de CurseForge devolvió ${response.status} para ${projectId}/${fileId}`,
      );
      throw new ServiceUnavailableException({
        message: `curseforge api rejected the api key (${response.status})`,
        userMessage:
          'CurseForge ha rechazado la clave del servidor. Avisa a un administrador.',
      });
    }
    if (response.status === 404 || !response.data?.data) {
      // §3.2 — `allowModDistribution: false`. There is no programmatic download
      // for these at all, so the launcher has to show a manual-download link.
      // This is not an edge case; it happens in most large packs.
      throw new NotFoundException({
        message: 'curseforge refuses third-party distribution for this file',
        userMessage:
          'El autor de este mod no permite descargas automáticas. Tendrás que bajarlo a mano desde CurseForge.',
      });
    }
    return response.data.data;
  }

  /**
   * Override blobs. §7.2 asks for short-TTL presigned URLs, which presupposes
   * object storage; we have none — blobs are plain files under PACK_BLOB_DIR —
   * so there is nothing to presign and this streams them through the guard
   * instead. Same property (never a public URL, always entitlement-checked),
   * one fewer moving part. Swap this for a presign the day blobs move to S3.
   */
  async override(blobSha512: string): Promise<ProxiedDownload> {
    // Caller-validated hex, but re-asserted here: this value becomes a path
    // segment and a traversal would read arbitrary files.
    if (!/^[a-f0-9]{128}$/.test(blobSha512)) {
      throw new NotFoundException('Blob no encontrado');
    }

    const path = blobPath(blobSha512);
    const size = await stat(path).then(
      (s) => s.size,
      () => null,
    );
    if (size === null) {
      throw new NotFoundException({
        message: `override blob ${blobSha512.slice(0, 8)} is not on disk`,
        userMessage: 'Ese archivo del pack no está disponible en el servidor.',
      });
    }

    return {
      stream: createReadStream(path),
      contentType: 'application/octet-stream',
      contentLength: size,
      filename: blobSha512,
    };
  }

  /** Size of a blob already on disk, or null. Lets the dashboard skip uploading
   *  a file the server already has — the same content hash is the same bytes. */
  async blobSize(blobSha512: string): Promise<number | null> {
    if (!/^[a-f0-9]{128}$/.test(blobSha512)) return null;
    return stat(blobPath(blobSha512)).then(
      (s) => s.size,
      () => null,
    );
  }

  /**
   * Ingest an override blob. The hash is computed from the bytes as they land —
   * never taken from the client — so the name of the file on disk is always a
   * true digest of its contents, which is the only reason the launcher's
   * post-download sha512 check means anything.
   *
   * Writes to a temp file and renames: a half-written blob under its final
   * (correct-looking) name would be served forever and fail verification on
   * every machine.
   */
  async storeBlob(source: Readable): Promise<{ sha512: string; size: number }> {
    const dir = blobDir();
    await mkdir(join(dir, 'tmp'), { recursive: true });
    const temp = join(dir, 'tmp', `${randomUUID()}.part`);

    const hash = createHash('sha512');
    let size = 0;
    let tooLarge = false;
    source.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BLOB_BYTES) {
        tooLarge = true;
        source.destroy();
        return;
      }
      hash.update(chunk);
    });

    try {
      await pipeline(source, createWriteStream(temp));
    } catch (error: unknown) {
      await rm(temp, { force: true });
      if (tooLarge) {
        throw new PayloadTooLargeException({
          message: `blob exceeds ${MAX_BLOB_BYTES} bytes`,
          userMessage: 'Ese archivo es demasiado grande (máx. 512 MB).',
        });
      }
      throw new BadRequestException({
        message: `blob upload failed: ${asMessage(error)}`,
        userMessage: 'La subida se ha interrumpido. Inténtalo de nuevo.',
      });
    }

    if (size === 0) {
      await rm(temp, { force: true });
      throw new BadRequestException({
        message: 'empty blob upload',
        userMessage: 'El archivo está vacío.',
      });
    }

    const sha512 = hash.digest('hex');
    const path = blobPath(sha512);
    await mkdir(dirname(path), { recursive: true });
    // rename over an existing blob is a no-op in content terms (same hash, same
    // bytes) and keeps re-uploads idempotent.
    await rename(temp, path);
    return { sha512, size };
  }
}

/** Content-addressed, sharded two levels so a pack with thousands of overrides
 *  does not put thousands of entries in one directory.
 *
 *  PACK_BLOB_DIR wins when set (prod: `./laboon/pack-blobs`, resolved against
 *  cwd — the same directory as the fallback, so behaviour does not change);
 *  without it, the laboon store. Read per call so tests can point it elsewhere. */
function blobDir(): string {
  return env.PACK_BLOB_DIR
    ? resolve(process.cwd(), env.PACK_BLOB_DIR)
    : laboonPath('pack-blobs');
}

function blobPath(sha512: string): string {
  return join(blobDir(), sha512.slice(0, 2), sha512.slice(2, 4), sha512);
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
