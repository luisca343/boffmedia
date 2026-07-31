import * as dotenv from 'dotenv';
dotenv.config();

import { createHash, randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import * as bcrypt from 'bcrypt';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import * as mysql from 'mysql2/promise';
import pino from 'pino';
import { PackManifest } from '@boffmedia/pack-schema';
import { env } from '@/config/env';

import { packInvites, packVersions, packs } from '../_db/schema/Packs';

const logger = pino({ name: 'packs-dev-seed' });

// Test fixtures for the launcher's install+launch path. The first two are public
// smoke-test packs; the gated fixtures exercise the same access and override
// paths a real private pack uses. The script is idempotent by slug.

const MINECRAFT = '1.21.4';

/** Mods pulled live from Modrinth so the sha512/size in the manifest are the
 *  real ones — the launcher verifies both after downloading. */
const MODS: { slug: string; env: { client: 'required' | 'unsupported'; server: 'required' | 'unsupported' } }[] = [
  { slug: 'fabric-api', env: { client: 'required', server: 'required' } },
  { slug: 'sodium', env: { client: 'required', server: 'unsupported' } },
  { slug: 'lithium', env: { client: 'required', server: 'required' } },
];

function newId(): string {
  return randomBytes(16).toString('hex');
}

async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'boffmedia/packs-dev-seed', ...headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function optionalCurseforgeFile(): Promise<unknown | null> {
  const key = env.CURSEFORGE_API_KEY;
  const projectId = Number(env.PACKS_DEV_CURSEFORGE_PROJECT_ID);
  const fileId = Number(env.PACKS_DEV_CURSEFORGE_FILE_ID);
  if (!key || !Number.isInteger(projectId) || !Number.isInteger(fileId)) {
    logger.info('no CurseForge fixture ids configured, skipping optional CF file');
    return null;
  }

  const headers = { 'x-api-key': key, accept: 'application/json' };
  const metadata = await getJson<{
    data: { fileName: string; fileLength: number };
  }>(`https://api.curseforge.com/v1/mods/${projectId}/files/${fileId}`, headers);
  const download = await getJson<{ data: string }>(
    `https://api.curseforge.com/v1/mods/${projectId}/files/${fileId}/download-url`,
    headers,
  );
  const response = await fetch(download.data, { headers: { 'x-api-key': key } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for CurseForge file`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha512 = createHash('sha512').update(bytes).digest('hex');
  logger.info({ projectId, fileId, fileName: metadata.data.fileName }, 'resolved optional CF file');
  return {
    path: `mods/${metadata.data.fileName}`,
    sha512,
    fileSize: bytes.length || metadata.data.fileLength,
    env: { client: 'required' as const, server: 'unsupported' as const },
    source: { kind: 'curseforge' as const, projectId, fileId },
  };
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

async function modrinthFile(slug: string, envSupport: (typeof MODS)[number]['env']) {
  const versions = await getJson<ModrinthVersion[]>(
    `https://api.modrinth.com/v2/project/${slug}/version` +
      `?loaders=%5B%22fabric%22%5D&game_versions=%5B%22${MINECRAFT}%22%5D`,
  );
  const version = versions[0];
  if (!version) throw new Error(`Modrinth has no ${MINECRAFT}/fabric version of ${slug}`);
  // The launcher takes the primary file (install/files.rs), so the manifest has
  // to describe that same one or the sha512 check fails on a correct download.
  const file = version.files.find((f) => f.primary) ?? version.files[0];
  if (!file) throw new Error(`Modrinth version ${version.id} of ${slug} has no files`);
  logger.info({ slug, version: version.version_number }, 'resolved mod');
  return {
    path: `mods/${file.filename}`,
    sha512: file.hashes.sha512,
    fileSize: file.size,
    env: envSupport,
    source: { kind: 'modrinth' as const, projectId: version.project_id, versionId: version.id },
  };
}

type SeedPack = {
  slug: string;
  name: string;
  summary: string;
  versionName: string;
  loader?: 'fabric-loader';
  loaderVersion?: string;
  accessKind?: 'public' | 'password' | 'allowlist';
  password?: string;
  files: unknown[];
};

async function seedBlob(content: string): Promise<{ sha512: string; fileSize: number }> {
  const bytes = Buffer.from(content, 'utf8');
  const sha512 = createHash('sha512').update(bytes).digest('hex');
  const root = env.PACK_BLOB_DIR ?? join(process.cwd(), 'data', 'pack-blobs');
  const path = join(root, sha512.slice(0, 2), sha512.slice(2, 4), sha512);
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  return { sha512, fileSize: bytes.length };
}

async function seedPack(
  db: MySql2Database,
  spec: SeedPack,
): Promise<string> {
  const [existing] = await db.select().from(packs).where(eq(packs.slug, spec.slug)).limit(1);
  if (existing) {
    logger.info({ slug: spec.slug }, 'pack already exists, skipping');
    return existing.id;
  }

  const packId = newId();
  const versionId = newId();

  const accessKind = spec.accessKind ?? 'public';

  // Same shape PacksService.createVersion builds, validated with the same
  // schema — a fixture that the API would have rejected is worse than none.
  const manifest = {
    formatVersion: 1 as const,
    pack: {
      id: packId,
      slug: spec.slug,
      name: spec.name,
      summary: spec.summary,
      access:
        accessKind === 'public'
          ? { kind: 'public' as const }
          : accessKind === 'password'
            ? { kind: 'password' as const }
            : { kind: 'allowlist' as const, uuids: [] },
      latestVersionId: versionId,
    },
    version: {
      id: versionId,
      name: spec.versionName,
      createdAt: new Date().toISOString(),
      dependencies: {
        minecraft: MINECRAFT,
        ...(spec.loader && spec.loaderVersion ? { [spec.loader]: spec.loaderVersion } : {}),
      },
      files: spec.files,
    },
  };
  const parsed = PackManifest.safeParse(manifest);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid manifest for ${spec.slug} at ${issue?.path.join('.')}: ${issue?.message}`);
  }

  await db.insert(packs).values({
    id: packId,
    slug: spec.slug,
    name: spec.name,
    summary: spec.summary,
    accessKind,
    passwordHash: spec.password ? await bcrypt.hash(spec.password, 10) : null,
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

  logger.info({ slug: spec.slug, packId, versionId, files: spec.files.length }, 'pack seeded');
  return packId;
}

async function seedInvite(db: MySql2Database, packId: string, code: string): Promise<void> {
  const [existing] = await db.select().from(packInvites).where(eq(packInvites.code, code)).limit(1);
  if (existing) return;
  await db.insert(packInvites).values({ code, packId, maxUses: 20 });
  logger.info({ code, packId }, 'invite seeded');
}

async function main() {
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

    const override = await seedBlob(
      '# Boff private fixture\n# This file verifies the authenticated override route.\n',
    );
    const curseforgeFile = await optionalCurseforgeFile();
    const privateFiles = [
      ...files,
      ...(curseforgeFile ? [curseforgeFile] : []),
      {
        path: 'config/boff-test/options.txt',
        sha512: override.sha512,
        fileSize: override.fileSize,
        env: { client: 'required' as const, server: 'unsupported' as const },
        source: { kind: 'override' as const, blobSha512: override.sha512 },
      },
    ];

    await seedPack(db, {
      slug: 'boff-password-test',
      name: 'Boff Private (contraseña)',
      summary: 'Pack de prueba con contraseña, mods de Modrinth y un override privado.',
      versionName: '1.0-private',
      loader: 'fabric-loader',
      loaderVersion,
      accessKind: 'password',
      password: 'boff-test-password',
      files: privateFiles,
    });

    const invitePackId = await seedPack(db, {
      slug: 'boff-invite-test',
      name: 'Boff Private (invitación)',
      summary: 'Pack de prueba con acceso por invitación y el mismo override privado.',
      versionName: '1.0-invite',
      loader: 'fabric-loader',
      loaderVersion,
      accessKind: 'allowlist',
      files: privateFiles,
    });
    await seedInvite(db, invitePackId, 'boff-test-invite');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
