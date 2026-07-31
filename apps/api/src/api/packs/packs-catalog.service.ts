import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { env } from '@/config/env';
import { PacksDownloadsService } from './packs-downloads.service';
import type { CatalogSearchQueryDto, ResolveFileDto } from './dto/packs.dto';
import type { ModFileEntity, ModSearchHitEntity, ResolvedFileEntity } from './entities/packs.entity';

const CF_API = 'https://api.curseforge.com/v1';
const CF_KEY_HEADER = 'x-api-key';
/** Minecraft, and the "Mc-Mods" class inside it. */
const CF_GAME_ID = 432;
const CF_CLASS_ID = 6;

const MODRINTH_API = 'https://api.modrinth.com/v2';
/** Modrinth's API rules require a descriptive, contactable User-Agent; generic
 *  agents get rate-limited or blocked outright. */
const MODRINTH_UA = 'boffmedia-launcher-admin/1.0 (luisca343@gmail.com)';

/** CurseForge's `modLoaderType` enum. */
const CF_LOADER: Record<string, number> = {
  forge: 1,
  fabric: 4,
  quilt: 5,
  neoforge: 6,
};

/** A jar we refuse to hash rather than spend unbounded memory/disk time on. */
const MAX_RESOLVE_BYTES = 512 * 1024 * 1024;

interface CfModSearchItem {
  id: number;
  slug: string;
  name: string;
  summary?: string | null;
  downloadCount?: number;
  logo?: { thumbnailUrl?: string | null; url?: string | null } | null;
  authors?: { name?: string }[];
}

interface CfFileItem {
  id: number;
  displayName: string;
  fileName: string;
  fileLength?: number;
  gameVersions?: string[];
  releaseType?: number;
  fileDate?: string;
  downloadUrl?: string | null;
}

interface ModrinthSearchHit {
  project_id: string;
  slug: string;
  title: string;
  description?: string | null;
  icon_url?: string | null;
  downloads?: number;
  author?: string | null;
}

interface ModrinthVersionFile {
  hashes?: { sha512?: string; sha1?: string };
  url: string;
  filename: string;
  primary?: boolean;
  size?: number;
}

interface ModrinthVersion {
  id: string;
  name: string;
  version_number: string;
  version_type?: string;
  game_versions?: string[];
  date_published?: string;
  files: ModrinthVersionFile[];
}

@Injectable()
export class PacksCatalogService {
  private readonly logger = new Logger(PacksCatalogService.name);

  /** Resolving a CurseForge or URL entry costs a full file download, so the same
   *  source asked twice while an admin edits a version must not download twice.
   *  Bounded so a long-lived process cannot grow without limit. */
  private readonly resolveCache = new Map<string, ResolvedFileEntity>();
  private static readonly CACHE_MAX = 500;

  constructor(
    private readonly http: HttpService,
    private readonly downloads: PacksDownloadsService,
  ) {}

  private get curseforgeKey(): string {
    if (!env.CURSEFORGE_API_KEY) {
      throw new ServiceUnavailableException({
        message: 'CURSEFORGE_API_KEY is not configured',
        userMessage:
          'El servidor no puede consultar CurseForge ahora mismo. Avisa a un administrador.',
      });
    }
    return env.CURSEFORGE_API_KEY;
  }

  async search(query: CatalogSearchQueryDto): Promise<ModSearchHitEntity[]> {
    return query.platform === 'curseforge'
      ? this.searchCurseforge(query)
      : this.searchModrinth(query);
  }

  private async searchCurseforge(q: CatalogSearchQueryDto): Promise<ModSearchHitEntity[]> {
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const params: Record<string, string | number> = {
      gameId: CF_GAME_ID,
      classId: CF_CLASS_ID,
      index: (q.page ?? 0) * pageSize,
      pageSize,
      sortField: 2,
      sortOrder: 'desc',
    };
    if (q.query) params.searchFilter = q.query;
    if (q.gameVersion) params.gameVersion = q.gameVersion;
    if (q.loader && CF_LOADER[q.loader] !== undefined) params.modLoaderType = CF_LOADER[q.loader];

    const data = await this.cfGet<{ data?: CfModSearchItem[] }>(`${CF_API}/mods/search`, params);
    return (data.data ?? []).map((m) => ({
      platform: 'curseforge' as const,
      projectId: String(m.id),
      slug: m.slug,
      name: m.name,
      summary: m.summary ?? '',
      iconUrl: m.logo?.thumbnailUrl ?? m.logo?.url ?? undefined,
      downloads: m.downloadCount ?? 0,
      author: m.authors?.[0]?.name ?? undefined,
    }));
  }

  private async searchModrinth(q: CatalogSearchQueryDto): Promise<ModSearchHitEntity[]> {
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const facets: string[][] = [['project_type:mod']];
    if (q.gameVersion) facets.push([`versions:${q.gameVersion}`]);
    if (q.loader) facets.push([`categories:${q.loader}`]);

    const data = await this.modrinthGet<{ hits?: ModrinthSearchHit[] }>(`${MODRINTH_API}/search`, {
      query: q.query ?? '',
      limit: pageSize,
      offset: (q.page ?? 0) * pageSize,
      facets: JSON.stringify(facets),
    });
    return (data.hits ?? []).map((h) => ({
      platform: 'modrinth' as const,
      projectId: h.project_id,
      slug: h.slug,
      name: h.title,
      summary: h.description ?? '',
      iconUrl: h.icon_url ?? undefined,
      downloads: h.downloads ?? 0,
      author: h.author ?? undefined,
    }));
  }

  async curseforgeFiles(
    projectId: string,
    gameVersion?: string,
    loader?: string,
    pageSize = 30,
  ): Promise<ModFileEntity[]> {
    const params: Record<string, string | number> = { pageSize: Math.min(pageSize, 50) };
    if (gameVersion) params.gameVersion = gameVersion;
    if (loader && CF_LOADER[loader] !== undefined) params.modLoaderType = CF_LOADER[loader];

    const data = await this.cfGet<{ data?: CfFileItem[] }>(
      `${CF_API}/mods/${encodeURIComponent(projectId)}/files`,
      params,
    );
    return (data.data ?? []).map((f) => ({
      platform: 'curseforge' as const,
      fileId: String(f.id),
      displayName: f.displayName,
      fileName: f.fileName,
      fileSize: f.fileLength ?? 0,
      gameVersions: f.gameVersions ?? [],
      releaseType: cfReleaseType(f.releaseType),
      datePublished: f.fileDate ?? '',
      // CurseForge only exposes sha1/md5; the manifest needs sha512, which can
      // only come from hashing the bytes (see resolve()).
      sha512: null,
      // A null downloadUrl is CurseForge saying the author forbids third-party
      // distribution. The file is unusable in a pack, so the picker must show it
      // as such rather than silently offering it.
      downloadable: Boolean(f.downloadUrl),
    }));
  }

  async modrinthVersions(
    projectId: string,
    gameVersion?: string,
    loader?: string,
  ): Promise<ModFileEntity[]> {
    const params: Record<string, string> = {};
    if (gameVersion) params.game_versions = JSON.stringify([gameVersion]);
    if (loader) params.loaders = JSON.stringify([loader]);

    const versions = await this.modrinthGet<ModrinthVersion[]>(
      `${MODRINTH_API}/project/${encodeURIComponent(projectId)}/version`,
      params,
    );
    return (versions ?? []).map((v) => {
      const file = primaryFile(v);
      return {
        platform: 'modrinth' as const,
        fileId: v.id,
        versionNumber: v.version_number,
        displayName: v.name,
        fileName: file?.filename ?? '',
        fileSize: file?.size ?? 0,
        gameVersions: v.game_versions ?? [],
        releaseType: modrinthReleaseType(v.version_type),
        datePublished: v.date_published ?? '',
        sha512: file?.hashes?.sha512 ?? null,
        downloadable: true,
      };
    });
  }

  async resolve(dto: ResolveFileDto): Promise<ResolvedFileEntity> {
    const source = dto.source;
    const key =
      source.kind === 'curseforge'
        ? `curseforge:${source.projectId}:${source.fileId}`
        : source.kind === 'modrinth'
          ? `modrinth:${source.projectId}:${source.versionId}`
          : `url:${source.url}`;

    const cached = this.resolveCache.get(key);
    if (cached) return cached;

    let resolved: ResolvedFileEntity;
    if (source.kind === 'modrinth') {
      resolved = await this.resolveModrinth(source.projectId, source.versionId);
    } else if (source.kind === 'curseforge') {
      const url = await this.downloads.curseforgeDownloadUrl(source.projectId, source.fileId);
      const { sha512, fileSize } = await this.hashRemote(url, {
        [CF_KEY_HEADER]: this.curseforgeKey,
      });
      resolved = { sha512, fileSize, fileName: fileNameFromUrl(url), source };
    } else {
      if (!/^https?:\/\//i.test(source.url)) {
        throw new BadRequestException({
          message: 'only http(s) urls can be resolved',
          userMessage: 'La URL debe empezar por http:// o https://',
        });
      }
      const { sha512, fileSize } = await this.hashRemote(source.url, {});
      resolved = { sha512, fileSize, fileName: fileNameFromUrl(source.url), source };
    }

    if (this.resolveCache.size >= PacksCatalogService.CACHE_MAX) {
      const oldest = this.resolveCache.keys().next().value;
      if (oldest !== undefined) this.resolveCache.delete(oldest);
    }
    this.resolveCache.set(key, resolved);
    return resolved;
  }

  private async resolveModrinth(
    projectId: string,
    versionId: string,
  ): Promise<ResolvedFileEntity> {
    // Modrinth publishes sha512 directly, so this costs one JSON call instead of
    // a full download.
    const version = await this.modrinthGet<ModrinthVersion>(
      `${MODRINTH_API}/version/${encodeURIComponent(versionId)}`,
      {},
    );
    const file = primaryFile(version);
    const sha512 = file?.hashes?.sha512;
    if (!file || !sha512) {
      throw new BadGatewayException({
        message: `modrinth version ${versionId} has no sha512`,
        userMessage: 'Modrinth no ha devuelto el hash de ese archivo.',
      });
    }
    return {
      sha512,
      fileSize: file.size ?? 0,
      fileName: file.filename,
      source: { kind: 'modrinth', projectId, versionId },
    };
  }

  /** Streams the file through a sha512 digest without ever holding it in memory. */
  private async hashRemote(
    url: string,
    headers: Record<string, string>,
  ): Promise<{ sha512: string; fileSize: number }> {
    const response = await firstValueFrom(
      this.http.get<Readable>(url, {
        responseType: 'stream',
        headers,
        // A 200 MB jar over a slow link must not trip a total timeout; only the
        // connection phase is bounded.
        timeout: 15_000,
        maxRedirects: 5,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(`No se ha podido descargar ${url}: ${asMessage(error)}`);
      throw new BadGatewayException({
        message: 'file source unreachable',
        userMessage: 'No se ha podido descargar el archivo para calcular su hash.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException({
        message: `file source rejected the request (${response.status})`,
        userMessage: 'El origen del archivo ha rechazado la petición del servidor.',
      });
    }
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `file source returned ${response.status}`,
        userMessage: 'El origen del archivo no ha devuelto nada descargable.',
      });
    }

    const stream = response.data;
    const hash = createHash('sha512');
    let fileSize = 0;

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        fileSize += chunk.length;
        if (fileSize > MAX_RESOLVE_BYTES) {
          stream.destroy();
          reject(
            new PayloadTooLargeException({
              message: `file exceeds ${MAX_RESOLVE_BYTES} bytes`,
              userMessage: 'Ese archivo es demasiado grande para procesarlo (máx. 512 MB).',
            }),
          );
          return;
        }
        hash.update(chunk);
      });
      stream.on('end', () => resolve());
      stream.on('error', (error: unknown) =>
        reject(
          new BadGatewayException({
            message: `download interrupted: ${asMessage(error)}`,
            userMessage: 'La descarga se ha interrumpido. Inténtalo de nuevo.',
          }),
        ),
      );
    });

    if (fileSize === 0) {
      throw new BadGatewayException({
        message: 'file source returned an empty body',
        userMessage: 'El archivo descargado está vacío.',
      });
    }
    return { sha512: hash.digest('hex'), fileSize };
  }

  private async cfGet<T>(url: string, params: Record<string, string | number>): Promise<T> {
    const key = this.curseforgeKey;
    const response = await firstValueFrom(
      this.http.get<T>(url, {
        params,
        headers: { [CF_KEY_HEADER]: key, accept: 'application/json' },
        timeout: 15_000,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(`API de CurseForge inalcanzable: ${asMessage(error)}`);
      throw new BadGatewayException({
        message: 'curseforge api unreachable',
        userMessage: 'No se ha podido contactar con CurseForge. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      this.logger.error(`API de CurseForge devolvió ${response.status} para ${url}`);
      throw new ServiceUnavailableException({
        message: `curseforge api rejected the api key (${response.status})`,
        userMessage: 'CurseForge ha rechazado la clave del servidor. Avisa a un administrador.',
      });
    }
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `curseforge api returned ${response.status}`,
        userMessage: 'CurseForge no ha devuelto resultados.',
      });
    }
    return response.data;
  }

  private async modrinthGet<T>(url: string, params: Record<string, string | number>): Promise<T> {
    const response = await firstValueFrom(
      this.http.get<T>(url, {
        params,
        headers: { 'user-agent': MODRINTH_UA, accept: 'application/json' },
        timeout: 15_000,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(`API de Modrinth inalcanzable: ${asMessage(error)}`);
      throw new BadGatewayException({
        message: 'modrinth api unreachable',
        userMessage: 'No se ha podido contactar con Modrinth. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException({
        message: `modrinth api rejected the request (${response.status})`,
        userMessage: 'Modrinth ha rechazado la petición del servidor. Avisa a un administrador.',
      });
    }
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `modrinth api returned ${response.status}`,
        userMessage: 'Modrinth no ha devuelto resultados.',
      });
    }
    return response.data;
  }
}

function primaryFile(version: ModrinthVersion): ModrinthVersionFile | undefined {
  return version.files?.find((f) => f.primary) ?? version.files?.[0];
}

function cfReleaseType(value: number | undefined): 'release' | 'beta' | 'alpha' {
  return value === 2 ? 'beta' : value === 3 ? 'alpha' : 'release';
}

function modrinthReleaseType(value: string | undefined): 'release' | 'beta' | 'alpha' {
  return value === 'beta' ? 'beta' : value === 'alpha' ? 'alpha' : 'release';
}

function fileNameFromUrl(url: string): string {
  const last = url.split('?')[0].split('/').pop() ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
