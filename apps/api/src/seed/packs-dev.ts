import * as dotenv from 'dotenv';
dotenv.config();

import { randomBytes } from 'crypto';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import * as mysql from 'mysql2/promise';
import pino from 'pino';
import { PackManifest } from '@boffmedia/pack-schema';
import { env } from '@/config/env';

import { packVersions, packs } from '../_db/schema/Packs';

const logger = pino({ name: 'packs-dev-seed' });

// Test fixtures for the launcher's install+launch path. Both packs are `public`
// so no ACL grant or invite is needed to see them — the point here is to
// exercise download → install → launch, not the entitlement gate (§7.2, which
// has its own tests).
//
// Deliberately no `override` files: no blob upload route exists yet
// (TODO(pack-blob-upload)), so an override source would 404 mid-install.

const MINECRAFT = '1.21.4';

/** Mods pulled live from Modrinth so the sha512/size in the manifest are the
 *  real ones — the launcher verifies both after downloading. */
const MODS: {
  slug: string;
  env: {
    client: 'required' | 'unsupported';
    server: 'required' | 'unsupported';
  };
}[] = [
  { slug: 'fabric-api', env: { client: 'required', server: 'required' } },
  { slug: 'sodium', env: { client: 'required', server: 'unsupported' } },
  { slug: 'lithium', env: { client: 'required', server: 'required' } },
];

function newId(): string {
  return randomBytes(16).toString('hex');
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'boffmedia/packs-dev-seed' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function latestFabricLoader(): Promise<string> {
  const list = await getJson<{ version: string; stable: boolean }[]>(
    'https://meta.fabricmc.net/v2/versions/loader',
  );
  const stable = list.find((l) => l.stable);
  if (!stable) throw new Error('Fabric meta returned no stable loader');
  return stable.version;
}

type ModrinthVersion = {
  id: string;
  project_id: string;
  version_number: string;
  files: {
    primary: boolean;
    filename: string;
    size: number;
    hashes: { sha512: string };
  }[];
};

async function modrinthFile(
  slug: string,
  envSupport: (typeof MODS)[number]['env'],
) {
  const versions = await getJson<ModrinthVersion[]>(
    `https://api.modrinth.com/v2/project/${slug}/version` +
      `?loaders=%5B%22fabric%22%5D&game_versions=%5B%22${MINECRAFT}%22%5D`,
  );
  const version = versions[0];
  if (!version)
    throw new Error(`Modrinth has no ${MINECRAFT}/fabric version of ${slug}`);
  // The launcher takes the primary file (install/files.rs), so the manifest has
  // to describe that same one or the sha512 check fails on a correct download.
  const file = version.files.find((f) => f.primary) ?? version.files[0];
  if (!file)
    throw new Error(`Modrinth version ${version.id} of ${slug} has no files`);
  logger.info({ slug, version: version.version_number }, 'resolved mod');
  return {
    path: `mods/${file.filename}`,
    sha512: file.hashes.sha512,
    fileSize: file.size,
    env: envSupport,
    source: {
      kind: 'modrinth' as const,
      projectId: version.project_id,
      versionId: version.id,
    },
  };
}

type SeedPack = {
  slug: string;
  name: string;
  summary: string;
  versionName: string;
  loader?: 'fabric-loader';
  loaderVersion?: string;
  files: unknown[];
};

async function seedPack(db: MySql2Database, spec: SeedPack): Promise<void> {
  const [existing] = await db
    .select()
    .from(packs)
    .where(eq(packs.slug, spec.slug))
    .limit(1);
  if (existing) {
    logger.info({ slug: spec.slug }, 'pack already exists, skipping');
    return;
  }

  const packId = newId();
  const versionId = newId();

  // Same shape PacksService.createVersion builds, validated with the same
  // schema — a fixture that the API would have rejected is worse than none.
  const manifest = {
    formatVersion: 1 as const,
    pack: {
      id: packId,
      slug: spec.slug,
      name: spec.name,
      summary: spec.summary,
      access: { kind: 'public' as const },
      latestVersionId: versionId,
    },
    version: {
      id: versionId,
      name: spec.versionName,
      createdAt: new Date().toISOString(),
      dependencies: {
        minecraft: MINECRAFT,
        ...(spec.loader && spec.loaderVersion
          ? { [spec.loader]: spec.loaderVersion }
          : {}),
      },
      files: spec.files,
    },
  };
  const parsed = PackManifest.safeParse(manifest);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid manifest for ${spec.slug} at ${issue?.path.join('.')}: ${issue?.message}`,
    );
  }

  await db.insert(packs).values({
    id: packId,
    slug: spec.slug,
    name: spec.name,
    summary: spec.summary,
    accessKind: 'public',
    latestVersionId: versionId,
  });
  await db.insert(packVersions).values({
    id: versionId,
    packId,
    name: spec.versionName,
    minecraft: MINECRAFT,
    loader: spec.loader ?? null,
    loaderVersion: spec.loaderVersion ?? null,
    files: spec.files,
    published: true,
    notes: 'Seed de prueba (packs-dev).',
  });

  logger.info(
    { slug: spec.slug, packId, versionId, files: spec.files.length },
    'pack seeded',
  );
}

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    await seedPack(db, {
      slug: 'boff-vanilla-test',
      name: 'Boff Vanilla (prueba)',
      summary: `Minecraft ${MINECRAFT} sin mods. Prueba mínima de instalación y arranque.`,
      versionName: '1.0',
      files: [],
    });

    const loaderVersion = await latestFabricLoader();
    const files = [];
    for (const mod of MODS) files.push(await modrinthFile(mod.slug, mod.env));

    await seedPack(db, {
      slug: 'boff-fabric-test',
      name: 'Boff Fabric (prueba)',
      summary: `Minecraft ${MINECRAFT} con Fabric ${loaderVersion} y tres mods de Modrinth.`,
      versionName: '1.0',
      loader: 'fabric-loader',
      loaderVersion,
      files,
    });
  } finally {
    await connection.end();
  }
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error({ err }, 'seed failed');
    process.exit(1);
  });
}
