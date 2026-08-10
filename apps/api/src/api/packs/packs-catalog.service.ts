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
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import type { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { env } from '@/config/env';
import { PacksDownloadsService } from './packs-downloads.service';
import type { CatalogSearchQueryDto, ResolveFileDto } from './dto/packs.dto';
import type {
  CategoryEntity,
  ModDependencyEntity,
  ModFileEntity,
  ModProjectEntity,
  ModSearchHitEntity,
  ModSearchPageEntity,
  ResolvedFileEntity,
} from './entities/packs.entity';

const CF_API = 'https://api.curseforge.com/v1';
const CF_KEY_HEADER = 'x-api-key';
/** Minecraft. */
const CF_GAME_ID = 432;

/** CurseForge classIds per project type. A pack ships more than jars: resource
 *  packs, shaders and datapacks all belong in `files` too. */
const CF_CLASS: Record<string, number> = {
  mod: 6,
  resourcepack: 12,
  shader: 6552,
  datapack: 6945,
};

/** Modrinth calls the same thing `project_type`. */
const MODRINTH_TYPE: Record<string, string> = {
  mod: 'mod',
  resourcepack: 'resourcepack',
  shader: 'shader',
  datapack: 'datapack',
};

/** CurseForge sortField ⇄ Modrinth index. Relevance is CF's "Featured" (1);
 *  there is no true relevance sort in its API. */
const CF_SORT: Record<string, number> = {
  relevance: 1,
  downloads: 6,
  updated: 3,
  name: 4,
  follows: 2,
};
const MODRINTH_SORT: Record<string, string> = {
  relevance: 'relevance',
  downloads: 'downloads',
  updated: 'updated',
  name: 'relevance',
  follows: 'follows',
};

/** CurseForge relationType enum → our relation names. 2/5 are the soft ones. */
const CF_RELATION: Record<number, ModDependencyEntity['relation'] | undefined> =
  {
    1: 'embedded',
    2: 'optional',
    3: 'required',
    4: undefined, // tool
    5: 'incompatible',
    6: undefined, // include
  };

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
  dateModified?: string;
  logo?: { thumbnailUrl?: string | null; url?: string | null } | null;
  authors?: { name?: string }[];
  categories?: {
    id?: number;
    name?: string;
    slug?: string;
    iconUrl?: string;
  }[];
  latestFilesIndexes?: { gameVersion?: string; modLoader?: number }[];
  links?: {
    websiteUrl?: string | null;
    sourceUrl?: string | null;
    issuesUrl?: string | null;
  } | null;
  screenshots?: { url?: string; thumbnailUrl?: string }[];
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
  dependencies?: { modId?: number; relationType?: number }[];
}

interface ModrinthSearchHit {
  project_id: string;
  slug: string;
  title: string;
  description?: string | null;
  icon_url?: string | null;
  downloads?: number;
  author?: string | null;
  categories?: string[];
  date_modified?: string;
  client_side?: string;
  server_side?: string;
}

interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  body?: string | null;
  icon_url?: string | null;
  downloads?: number;
  categories?: string[];
  game_versions?: string[];
  loaders?: string[];
  gallery?: { url?: string }[];
  source_url?: string | null;
  issues_url?: string | null;
  wiki_url?: string | null;
  client_side?: string;
  server_side?: string;
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
  loaders?: string[];
  date_published?: string;
  files: ModrinthVersionFile[];
  dependencies?: {
    project_id?: string | null;
    version_id?: string | null;
    dependency_type?: string;
  }[];
}

@Injectable()
export class PacksCatalogService {
  private readonly logger = new Logger(PacksCatalogService.name);

  /** Resolving a CurseForge or URL entry costs a full file download, so the same
   *  source asked twice while an admin edits a version must not download twice.
   *  Bounded so a long-lived process cannot grow without limit. */
  private readonly resolveCache = new Map<string, ResolvedFileEntity>();
  private static readonly CACHE_MAX = 500;

  /** Category lists change about once a year; one fetch per process is plenty. */
  private readonly categoryCache = new Map<string, CategoryEntity[]>();

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

  async search(query: CatalogSearchQueryDto): Promise<ModSearchPageEntity> {
    return query.platform === 'curseforge'
      ? this.searchCurseforge(query)
      : this.searchModrinth(query);
  }

  private async searchCurseforge(
    q: CatalogSearchQueryDto,
  ): Promise<ModSearchPageEntity> {
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const params: Record<string, string | number> = {
      gameId: CF_GAME_ID,
      classId: CF_CLASS[q.projectType ?? 'mod'] ?? CF_CLASS.mod,
      index: (q.page ?? 0) * pageSize,
      pageSize,
      sortField: CF_SORT[q.sort ?? 'downloads'] ?? CF_SORT.downloads,
      sortOrder: q.sort === 'name' ? 'asc' : 'desc',
    };
    if (q.query) params.searchFilter = q.query;
    if (q.gameVersion) params.gameVersion = q.gameVersion;
    if (q.loader && CF_LOADER[q.loader] !== undefined)
      params.modLoaderType = CF_LOADER[q.loader];
    // CurseForge takes ONE category id per search, not a list.
    if (q.category) params.categoryId = q.category;

    const data = await this.cfGet<{
      data?: CfModSearchItem[];
      pagination?: { totalCount?: number };
    }>(`${CF_API}/mods/search`, params);

    return {
      hits: (data.data ?? []).map((m) => cfHit(m)),
      // CurseForge caps the reported total at 10 000 and refuses index>10 000
      // regardless; paging past that is upstream-impossible, not a bug here.
      total: Math.min(data.pagination?.totalCount ?? 0, 10_000),
    };
  }

  private async searchModrinth(
    q: CatalogSearchQueryDto,
  ): Promise<ModSearchPageEntity> {
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const facets: string[][] = [
      [`project_type:${MODRINTH_TYPE[q.projectType ?? 'mod'] ?? 'mod'}`],
    ];
    if (q.gameVersion) facets.push([`versions:${q.gameVersion}`]);
    if (q.loader) facets.push([`categories:${q.loader}`]);
    if (q.category) facets.push([`categories:${q.category}`]);

    const data = await this.modrinthGet<{
      hits?: ModrinthSearchHit[];
      total_hits?: number;
    }>(`${MODRINTH_API}/search`, {
      query: q.query ?? '',
      limit: pageSize,
      offset: (q.page ?? 0) * pageSize,
      index: MODRINTH_SORT[q.sort ?? 'downloads'] ?? 'downloads',
      facets: JSON.stringify(facets),
    });
    return {
      hits: (data.hits ?? []).map((h) => ({
        platform: 'modrinth' as const,
        projectId: h.project_id,
        slug: h.slug,
        name: h.title,
        summary: h.description ?? '',
        iconUrl: h.icon_url ?? undefined,
        downloads: h.downloads ?? 0,
        author: h.author ?? undefined,
        categories: h.categories ?? [],
        updatedAt: h.date_modified,
        clientSide: side(h.client_side),
        serverSide: side(h.server_side),
      })),
      total: data.total_hits ?? 0,
    };
  }

  /** The category sidebar. Both lists are small and near-static, so they are
   *  cached for the life of the process. */
  async categories(
    platform: string,
    projectType = 'mod',
  ): Promise<CategoryEntity[]> {
    const key = `${platform}:${projectType}`;
    const hit = this.categoryCache.get(key);
    if (hit) return hit;

    let list: CategoryEntity[];
    if (platform === 'curseforge') {
      const data = await this.cfGet<{
        data?: { id: number; name: string; iconUrl?: string }[];
      }>(`${CF_API}/categories`, {
        gameId: CF_GAME_ID,
        classId: CF_CLASS[projectType] ?? CF_CLASS.mod,
      });
      list = (data.data ?? []).map((c) => ({
        id: String(c.id),
        name: c.name,
        iconUrl: c.iconUrl,
      }));
    } else {
      const data = await this.modrinthGet<
        { name: string; project_type: string; icon?: string }[]
      >(`${MODRINTH_API}/tag/category`, {});
      const wanted = MODRINTH_TYPE[projectType] ?? 'mod';
      list = (data ?? [])
        .filter((c) => c.project_type === wanted)
        .map((c) => ({ id: c.name, name: c.name }));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    this.categoryCache.set(key, list);
    return list;
  }

  /** The detail panel: full description, gallery, links and side support. */
  async project(
    platform: string,
    projectId: string,
  ): Promise<ModProjectEntity> {
    if (platform === 'curseforge') {
      const [detail, description] = await Promise.all([
        this.cfGet<{ data?: CfModSearchItem }>(
          `${CF_API}/mods/${encodeURIComponent(projectId)}`,
          {},
        ),
        this.cfGet<{ data?: string }>(
          `${CF_API}/mods/${encodeURIComponent(projectId)}/description`,
          {},
        ).catch(() => ({ data: '' })),
      ]);
      const mod = detail.data;
      if (!mod) {
        throw new BadGatewayException({
          message: `curseforge project ${projectId} not found`,
          userMessage: 'CurseForge no ha devuelto ese proyecto.',
        });
      }
      const base = cfHit(mod);
      return {
        ...base,
        description: description.data ?? '',
        gameVersions: unique(
          (mod.latestFilesIndexes ?? [])
            .map((i) => i.gameVersion ?? '')
            .filter(Boolean),
        ),
        loaders: unique(
          (mod.latestFilesIndexes ?? [])
            .map((i) => cfLoaderName(i.modLoader))
            .filter((v): v is string => Boolean(v)),
        ),
        gallery: (mod.screenshots ?? [])
          .map((s) => s.url ?? s.thumbnailUrl ?? '')
          .filter(Boolean),
        sourceUrl: mod.links?.sourceUrl ?? undefined,
        issuesUrl: mod.links?.issuesUrl ?? undefined,
        websiteUrl: mod.links?.websiteUrl ?? undefined,
        // CurseForge does not publish client/server support at project level.
        clientSide: 'unknown',
        serverSide: 'unknown',
      };
    }

    const project = await this.modrinthGet<ModrinthProject>(
      `${MODRINTH_API}/project/${encodeURIComponent(projectId)}`,
      {},
    );
    return {
      platform: 'modrinth',
      projectId: project.id,
      slug: project.slug,
      name: project.title,
      summary: project.description ?? '',
      description: project.body ?? '',
      iconUrl: project.icon_url ?? undefined,
      downloads: project.downloads ?? 0,
      categories: project.categories ?? [],
      gameVersions: project.game_versions ?? [],
      loaders: project.loaders ?? [],
      gallery: (project.gallery ?? []).map((g) => g.url ?? '').filter(Boolean),
      sourceUrl: project.source_url ?? undefined,
      issuesUrl: project.issues_url ?? undefined,
      websiteUrl: project.wiki_url ?? undefined,
      clientSide: side(project.client_side),
      serverSide: side(project.server_side),
    };
  }

  /** Names and icons for a set of project ids, so a dependency list can be
   *  shown as mods rather than as bare numbers. One batched call per platform. */
  async projectSummaries(
    platform: string,
    ids: string[],
  ): Promise<ModSearchHitEntity[]> {
    const wanted = unique(ids).slice(0, 100);
    if (wanted.length === 0) return [];

    if (platform === 'curseforge') {
      const numeric = wanted.map(Number).filter((n) => Number.isFinite(n));
      if (numeric.length === 0) return [];
      const data = await this.cfPost<{ data?: CfModSearchItem[] }>(
        `${CF_API}/mods`,
        {
          modIds: numeric,
        },
      );
      return (data.data ?? []).map((m) => cfHit(m));
    }

    const data = await this.modrinthGet<ModrinthProject[]>(
      `${MODRINTH_API}/projects`,
      {
        ids: JSON.stringify(wanted),
      },
    );
    return (data ?? []).map((p) => ({
      platform: 'modrinth' as const,
      projectId: p.id,
      slug: p.slug,
      name: p.title,
      summary: p.description ?? '',
      iconUrl: p.icon_url ?? undefined,
      downloads: p.downloads ?? 0,
      categories: p.categories ?? [],
      clientSide: side(p.client_side),
      serverSide: side(p.server_side),
    }));
  }

  async curseforgeFiles(
    projectId: string,
    gameVersion?: string,
    loader?: string,
    pageSize = 30,
  ): Promise<ModFileEntity[]> {
    const params: Record<string, string | number> = {
      pageSize: Math.min(pageSize, 50),
    };
    if (gameVersion) params.gameVersion = gameVersion;
    if (loader && CF_LOADER[loader] !== undefined)
      params.modLoaderType = CF_LOADER[loader];

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
      loaders: unique(
        (f.gameVersions ?? [])
          .map((v) => v.toLowerCase())
          .filter((v) => ['forge', 'neoforge', 'fabric', 'quilt'].includes(v)),
      ),
      dependencies: (f.dependencies ?? [])
        .map((d): ModDependencyEntity | null => {
          const relation = CF_RELATION[d.relationType ?? 0];
          if (!relation || !d.modId) return null;
          return {
            platform: 'curseforge' as const,
            projectId: String(d.modId),
            relation,
          };
        })
        .filter((d): d is ModDependencyEntity => d !== null),
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
        loaders: v.loaders ?? [],
        dependencies: (v.dependencies ?? [])
          .map((d): ModDependencyEntity | null => {
            const relation = modrinthRelation(d.dependency_type);
            if (!relation || !d.project_id) return null;
            return {
              platform: 'modrinth' as const,
              projectId: d.project_id,
              relation,
              versionId: d.version_id ?? undefined,
            };
          })
          .filter((d): d is ModDependencyEntity => d !== null),
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
      const url = await this.downloads.curseforgeDownloadUrl(
        source.projectId,
        source.fileId,
      );
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
      // Admin-supplied URL — the one SSRF-able source. Fetched with DNS/private
      // -range validation on every hop; CF/Modrinth URLs come from their APIs
      // and keep the plain path.
      const { sha512, fileSize } = await this.hashRemotePublic(source.url);
      resolved = {
        sha512,
        fileSize,
        fileName: fileNameFromUrl(source.url),
        source,
      };
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

  /**
   * The url-source fetch. Every hop — the original URL and each redirect, capped
   * at 2 — must resolve to public addresses only, and every failure collapses to
   * ONE opaque error: a distinguishable error taxonomy here is a blind-SSRF
   * oracle over the internal network.
   */
  private async hashRemotePublic(
    url: string,
  ): Promise<{ sha512: string; fileSize: number }> {
    const MAX_HOPS = 2;
    let current = url;
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
      await this.assertPublicHttpUrl(current);
      const response = await firstValueFrom(
        this.http.get<Readable>(current, {
          responseType: 'stream',
          timeout: 15_000,
          maxRedirects: 0,
          validateStatus: () => true,
        }),
      ).catch(() => {
        throw urlResolveFailure();
      });

      if (response.status >= 300 && response.status < 400) {
        response.data?.destroy();
        const location = response.headers['location'] as string | undefined;
        if (!location || hop === MAX_HOPS) throw urlResolveFailure();
        try {
          current = new URL(location, current).toString();
        } catch {
          throw urlResolveFailure();
        }
        continue;
      }
      if (response.status >= 400) {
        response.data?.destroy();
        throw urlResolveFailure();
      }
      return this.digestStream(response.data);
    }
    throw urlResolveFailure();
  }

  /** http(s) only, and no hostname that resolves to loopback / private /
   *  link-local / CGNAT / ULA space. Failure is the same opaque error as every
   *  other url-source failure. */
  private async assertPublicHttpUrl(raw: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw urlResolveFailure();
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw urlResolveFailure();
    }
    const host = parsed.hostname.replace(/^\[|\]$/g, '');
    let addresses: string[];
    try {
      addresses = isIP(host)
        ? [host]
        : (await lookup(host, { all: true, verbatim: true })).map(
            (a) => a.address,
          );
    } catch {
      throw urlResolveFailure();
    }
    if (addresses.length === 0 || addresses.some(isPrivateIp)) {
      throw urlResolveFailure();
    }
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
      this.logger.error(
        `No se ha podido descargar ${url}: ${asMessage(error)}`,
      );
      throw new BadGatewayException({
        message: 'file source unreachable',
        userMessage:
          'No se ha podido descargar el archivo para calcular su hash.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException({
        message: `file source rejected the request (${response.status})`,
        userMessage:
          'El origen del archivo ha rechazado la petición del servidor.',
      });
    }
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `file source returned ${response.status}`,
        userMessage: 'El origen del archivo no ha devuelto nada descargable.',
      });
    }

    return this.digestStream(response.data);
  }

  private async digestStream(
    stream: Readable,
  ): Promise<{ sha512: string; fileSize: number }> {
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
              userMessage:
                'Ese archivo es demasiado grande para procesarlo (máx. 512 MB).',
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

  private async cfGet<T>(
    url: string,
    params: Record<string, string | number>,
  ): Promise<T> {
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
        userMessage:
          'No se ha podido contactar con CurseForge. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `API de CurseForge devolvió ${response.status} para ${url}`,
      );
      throw new ServiceUnavailableException({
        message: `curseforge api rejected the api key (${response.status})`,
        userMessage:
          'CurseForge ha rechazado la clave del servidor. Avisa a un administrador.',
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

  /** CurseForge's batch project lookup is POST-only. */
  private async cfPost<T>(url: string, body: unknown): Promise<T> {
    const key = this.curseforgeKey;
    const response = await firstValueFrom(
      this.http.post<T>(url, body, {
        headers: {
          [CF_KEY_HEADER]: key,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        timeout: 15_000,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(`API de CurseForge inalcanzable: ${asMessage(error)}`);
      throw new BadGatewayException({
        message: 'curseforge api unreachable',
        userMessage:
          'No se ha podido contactar con CurseForge. Inténtalo de nuevo.',
      });
    });
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `curseforge api returned ${response.status}`,
        userMessage: 'CurseForge no ha devuelto resultados.',
      });
    }
    return response.data;
  }

  private async modrinthGet<T>(
    url: string,
    params: Record<string, string | number>,
  ): Promise<T> {
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
        userMessage:
          'No se ha podido contactar con Modrinth. Inténtalo de nuevo.',
      });
    });

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException({
        message: `modrinth api rejected the request (${response.status})`,
        userMessage:
          'Modrinth ha rechazado la petición del servidor. Avisa a un administrador.',
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

function cfHit(m: CfModSearchItem): ModSearchHitEntity {
  return {
    platform: 'curseforge',
    projectId: String(m.id),
    slug: m.slug,
    name: m.name,
    summary: m.summary ?? '',
    iconUrl: m.logo?.thumbnailUrl ?? m.logo?.url ?? undefined,
    downloads: m.downloadCount ?? 0,
    author: m.authors?.[0]?.name ?? undefined,
    categories: (m.categories ?? []).map((c) => c.name ?? '').filter(Boolean),
    updatedAt: m.dateModified,
  };
}

/** Inverse of CF_LOADER — CurseForge's file index reports the numeric enum. */
function cfLoaderName(value: number | undefined): string | undefined {
  return Object.keys(CF_LOADER).find((name) => CF_LOADER[name] === value);
}

function modrinthRelation(
  value: string | undefined,
): ModDependencyEntity['relation'] | null {
  if (value === 'required') return 'required';
  if (value === 'optional') return 'optional';
  if (value === 'incompatible') return 'incompatible';
  if (value === 'embedded') return 'embedded';
  return null;
}

function side(
  value: string | undefined,
): 'required' | 'optional' | 'unsupported' | 'unknown' {
  return value === 'required' || value === 'optional' || value === 'unsupported'
    ? value
    : 'unknown';
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function primaryFile(
  version: ModrinthVersion,
): ModrinthVersionFile | undefined {
  return version.files?.find((f) => f.primary) ?? version.files?.[0];
}

function cfReleaseType(
  value: number | undefined,
): 'release' | 'beta' | 'alpha' {
  return value === 2 ? 'beta' : value === 3 ? 'alpha' : 'release';
}

function modrinthReleaseType(
  value: string | undefined,
): 'release' | 'beta' | 'alpha' {
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

/** The ONE error every url-source failure surfaces as — DNS, private range,
 *  connect, status, redirect. Distinguishable variants would let an admin
 *  session (or a stolen one) map the internal network blind. */
function urlResolveFailure(): BadGatewayException {
  return new BadGatewayException({
    message: 'url source could not be resolved',
    userMessage: 'No se ha podido descargar esa URL.',
  });
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIpv4(ip);
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice(7);
    if (isIP(v4) === 4) return isPrivateIpv4(v4);
  }
  const first = parseInt(lower.split(':')[0] || '0', 16);
  if (Number.isNaN(first)) return true;
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local
  return false;
}

function isPrivateIpv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && (b === 168 || b === 0)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
