import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  GameVersionEntity,
  LoaderVersionEntity,
} from './entities/packs.entity';

// Version autocompletion. Every list here comes from an upstream that is slow,
// rate-limited or both, and none of them change more than a few times a day, so
// each response is cached in-process behind a TTL. The browser must NOT call
// these upstreams directly: Forge and NeoForge serve maven metadata as XML with
// no CORS headers.

const PISTON_MANIFEST =
  'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const FABRIC_META = 'https://meta.fabricmc.net/v2';
const QUILT_META = 'https://meta.quiltmc.org/v3';
const NEOFORGE_MAVEN =
  'https://maven.neoforged.net/api/maven/versions/releases';
const FORGE_METADATA =
  'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml';
const FORGE_PROMOTIONS =
  'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';

const TTL_MS = 30 * 60 * 1000;

interface PistonManifest {
  latest?: { release?: string; snapshot?: string };
  versions?: { id: string; type: string; releaseTime?: string }[];
}

interface FabricLoaderEntry {
  loader?: { version?: string; stable?: boolean; build?: number };
}

interface CacheEntry {
  at: number;
  value: unknown;
}

@Injectable()
export class PacksMetaService {
  private readonly logger = new Logger(PacksMetaService.name);
  private readonly cache = new Map<string, CacheEntry>();
  /** Two admins opening the modal at once must not fire two identical fetches. */
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly http: HttpService) {}

  async gameVersions(): Promise<GameVersionEntity[]> {
    return this.cached('mc', async () => {
      const manifest = await this.getJson<PistonManifest>(PISTON_MANIFEST, {});
      const latestRelease = manifest.latest?.release;
      const latestSnapshot = manifest.latest?.snapshot;
      return (manifest.versions ?? []).map((v) => ({
        id: v.id,
        type: gameVersionType(v.type),
        releaseTime: v.releaseTime ?? '',
        latest: v.id === latestRelease || v.id === latestSnapshot,
      }));
    });
  }

  /** `loader` is the MANIFEST id ("fabric-loader"), not the catalog id. */
  async loaderVersions(
    loader: string,
    minecraft: string,
  ): Promise<LoaderVersionEntity[]> {
    const key = `loader:${loader}:${minecraft}`;
    return this.cached(key, async () => {
      switch (loader) {
        case 'fabric-loader':
          return this.fabricLike(
            `${FABRIC_META}/versions/loader/${encodeURIComponent(minecraft)}`,
          );
        case 'quilt-loader':
          return this.fabricLike(
            `${QUILT_META}/versions/loader/${encodeURIComponent(minecraft)}`,
          );
        case 'neoforge':
          return this.neoforge(minecraft);
        case 'forge':
          return this.forge(minecraft);
        default:
          return [];
      }
    });
  }

  /** Fabric and Quilt publish the same shape: newest first, `stable` flagged. */
  private async fabricLike(url: string): Promise<LoaderVersionEntity[]> {
    const entries = await this.getJson<FabricLoaderEntry[]>(url, {});
    let stableSeen = false;
    return (entries ?? [])
      .map((e) => e.loader)
      .filter((l): l is NonNullable<FabricLoaderEntry['loader']> =>
        Boolean(l?.version),
      )
      .map((l, index) => {
        // Fabric publishes `stable`; Quilt does not, so fall back to the version
        // string — without this every Quilt build would look unstable.
        const version = l.version as string;
        const stable = l.stable ?? !/beta|pre|rc/i.test(version);
        const recommended = stable && !stableSeen;
        if (recommended) stableSeen = true;
        return { version, stable, latest: index === 0, recommended };
      });
  }

  /** NeoForge derives its version from the Minecraft one, with the leading "1."
   *  of the old scheme dropped and the result padded to three components:
   *    1.21.4 → 21.4.x    1.21 → 21.0.x    26.2 → 26.2.0.x    26.1.2 → 26.1.2.x
   *  (Minecraft switched to the year-based 26.x scheme, which keeps all three
   *  of its own components — assuming "1.x.y" here silently returns nothing.)
   *  Only 1.20.2+ exists as `neoforge`; 1.20.1 shipped under the old
   *  `net.neoforged:forge` coordinates and is deliberately not offered here. */
  private async neoforge(minecraft: string): Promise<LoaderVersionEntity[]> {
    const parts = minecraft.split('.');
    const legacy = parts[0] === '1';
    if (legacy) parts.shift();
    if (parts.length === 0 || !/^\d+$/.test(parts[0])) return [];
    // The old scheme contributes two components (21.4 → 21.4.<build>); the new
    // one keeps its own three (26.2 → 26.2.0.<build>).
    const width = legacy ? 2 : 3;
    while (parts.length < width) parts.push('0');
    const prefix = `${parts.slice(0, width).join('.')}.`;

    const data = await this.getJson<{ versions?: string[] }>(
      `${NEOFORGE_MAVEN}/net/neoforged/neoforge`,
      {},
    );
    const matching = (data.versions ?? []).filter((v) => v.startsWith(prefix));
    // Maven metadata is oldest-first; the picker wants newest at the top.
    matching.reverse();
    const firstStable = matching.find((v) => !v.includes('beta'));
    return matching.map((version, index) => ({
      version,
      stable: !version.includes('beta'),
      latest: index === 0,
      recommended: version === firstStable,
    }));
  }

  /** Forge's maven metadata is XML and its versions read `<mc>-<build>`; the
   *  promotions file is what names the recommended build for each MC version. */
  private async forge(minecraft: string): Promise<LoaderVersionEntity[]> {
    const [xml, promos] = await Promise.all([
      this.getText(FORGE_METADATA),
      this.getJson<{ promos?: Record<string, string> }>(
        FORGE_PROMOTIONS,
        {},
      ).catch((): { promos?: Record<string, string> } => ({})),
    ]);

    const prefix = `${minecraft}-`;
    const versions: string[] = [];
    for (const match of xml.matchAll(/<version>([^<]+)<\/version>/g)) {
      const value = match[1].trim();
      if (value.startsWith(prefix)) versions.push(value.slice(prefix.length));
    }
    versions.reverse();

    const recommended = promos.promos?.[`${minecraft}-recommended`];
    const latest = promos.promos?.[`${minecraft}-latest`];
    return versions.map((version, index) => ({
      version,
      stable: true,
      latest: version === latest || (!latest && index === 0),
      recommended: version === recommended,
    }));
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;

    const running = this.inFlight.get(key);
    if (running) return running as Promise<T>;

    const promise = load()
      .then((value) => {
        this.cache.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  private async getJson<T>(
    url: string,
    params: Record<string, string>,
  ): Promise<T> {
    const response = await firstValueFrom(
      this.http.get<T>(url, {
        params,
        headers: { accept: 'application/json' },
        timeout: 15_000,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(
        `Metadatos inalcanzables en ${url}: ${asMessage(error)}`,
      );
      throw new BadGatewayException({
        message: 'version metadata source unreachable',
        userMessage:
          'No se han podido cargar las versiones. Inténtalo de nuevo.',
      });
    });
    if (response.status >= 400) {
      throw new BadGatewayException({
        message: `version metadata source returned ${response.status}`,
        userMessage: 'No se han podido cargar las versiones.',
      });
    }
    return response.data;
  }

  private async getText(url: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<string>(url, {
        responseType: 'text',
        timeout: 15_000,
        validateStatus: () => true,
      }),
    ).catch((error: unknown) => {
      this.logger.error(
        `Metadatos inalcanzables en ${url}: ${asMessage(error)}`,
      );
      throw new BadGatewayException({
        message: 'version metadata source unreachable',
        userMessage:
          'No se han podido cargar las versiones. Inténtalo de nuevo.',
      });
    });
    if (response.status >= 400 || typeof response.data !== 'string') {
      throw new BadGatewayException({
        message: `version metadata source returned ${response.status}`,
        userMessage: 'No se han podido cargar las versiones.',
      });
    }
    return response.data;
  }
}

function gameVersionType(
  value: string,
): 'release' | 'snapshot' | 'old_beta' | 'old_alpha' {
  return value === 'release' || value === 'snapshot' || value === 'old_beta'
    ? value
    : 'old_alpha';
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
