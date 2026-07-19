/**
 * IndexedDB cache for scanned {@link BlockRegistry} instances.
 *
 * Built on Dexie v4. Cache key is a stable string fingerprint derived from the
 * sorted file metadata (name / size / lastModified) of the instance's meta and
 * JAR files — no crypto hashing needed, and it changes whenever the mods folder
 * changes.
 *
 * Policy: max 10 entries, 30-day TTL, LRU eviction on access.
 * Textures (data-URL strings) ARE stored — they're the most expensive part to
 * re-derive and typical modpack texture sets are well within IndexedDB quota.
 * All errors (quota exceeded, private browsing) are caught and silently skipped
 * so a cache miss never breaks the scan flow.
 */

import Dexie from "dexie";
import type { BlockRegistry, BlockDefinition, ModInfo } from "../types";

// ─── Serialized shape ────────────────────────────────────────────────────────
// Maps are not JSON-serializable; we flatten them to plain objects.

interface SerializedRegistry {
  gameId: "minecraft" | "hytale";
  version: string;
  dataVersion?: number;
  modLoader?: "forge" | "fabric" | "neoforge";
  mods: ModInfo[];
  blocks: Record<string, BlockDefinition>;
  tags: Record<string, string[]>;
  textures?: Record<string, string>;
  snapshotHash: string;
  capturedAt: number;
  instanceName?: string;
}

interface CacheEntry {
  /** Fingerprint string — primary key. */
  id: string;
  data: SerializedRegistry;
  lastAccessedAt: number;
  createdAt: number;
}

// ─── Dexie schema ────────────────────────────────────────────────────────────

class RegistryCacheDB extends Dexie {
  entries!: Dexie.Table<CacheEntry, string>;

  constructor() {
    super("schematic-compat-registry-cache");
    this.version(1).stores({
      entries: "id, lastAccessedAt",
    });
  }
}

// Lazily created — avoid touching IndexedDB at module load time.
let _db: RegistryCacheDB | null = null;

function getDB(): RegistryCacheDB {
  if (!_db) _db = new RegistryCacheDB();
  return _db;
}

// ─── Fingerprint ──────────────────────────────────────────────────────────────

/**
 * Stable fingerprint from sorted file metadata. Incorporates both meta files
 * (carry the instance version) and JAR files (carry the mod set), plus any
 * manual version/loader override — the same folder scanned as two different
 * versions must not collide on one cache entry.
 */
export function fingerprintFiles(
  metaFiles: File[],
  jarFiles: File[],
  override?: { version: string; modLoader?: string },
): string {
  const files = [...metaFiles, ...jarFiles]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => `${f.name}:${f.size}:${f.lastModified}`)
    .join("|");
  return override ? `${files}#${override.version}:${override.modLoader ?? ""}` : files;
}

// ─── Serialization helpers ────────────────────────────────────────────────────

function serialize(reg: BlockRegistry): SerializedRegistry {
  const blocks: Record<string, BlockDefinition> = {};
  reg.blocks.forEach((def, id) => {
    blocks[id] = def;
  });
  const tags: Record<string, string[]> = {};
  reg.tags.forEach((members, tagId) => {
    tags[tagId] = members;
  });
  const textures: Record<string, string> | undefined = reg.textures
    ? Object.fromEntries(reg.textures)
    : undefined;

  return {
    gameId: reg.gameId,
    version: reg.version,
    dataVersion: reg.dataVersion,
    modLoader: reg.modLoader,
    mods: reg.mods,
    blocks,
    tags,
    textures,
    snapshotHash: reg.snapshotHash,
    capturedAt: reg.capturedAt,
    instanceName: reg.instanceName,
  };
}

function deserialize(s: SerializedRegistry): BlockRegistry {
  const blocks = new Map<string, BlockDefinition>(Object.entries(s.blocks));
  const tags = new Map<string, string[]>(Object.entries(s.tags));
  const textures = s.textures ? new Map<string, string>(Object.entries(s.textures)) : undefined;

  return {
    gameId: s.gameId,
    version: s.version,
    dataVersion: s.dataVersion,
    modLoader: s.modLoader,
    mods: s.mods,
    blocks,
    tags,
    textures,
    snapshotHash: s.snapshotHash,
    capturedAt: s.capturedAt,
    instanceName: s.instanceName,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

const MAX_ENTRIES = 10;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Read a registry from cache. Returns `null` on miss or error. */
export async function cacheGet(fingerprint: string): Promise<BlockRegistry | null> {
  try {
    const db = getDB();
    const entry = await db.entries.get(fingerprint);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.createdAt > MAX_AGE_MS) {
      await db.entries.delete(fingerprint).catch(() => void 0);
      return null;
    }

    // Update LRU timestamp without awaiting — fire-and-forget.
    db.entries.update(fingerprint, { lastAccessedAt: now }).catch(() => void 0);

    return deserialize(entry.data);
  } catch {
    return null;
  }
}

/** Store a registry in cache. Silently swallows all errors (quota, etc.). */
export async function cachePut(fingerprint: string, registry: BlockRegistry): Promise<void> {
  try {
    const db = getDB();
    const now = Date.now();

    await db.entries.put({ id: fingerprint, data: serialize(registry), lastAccessedAt: now, createdAt: now });

    // Evict oldest entries beyond the cap.
    const count = await db.entries.count();
    if (count > MAX_ENTRIES) {
      const toDelete = count - MAX_ENTRIES;
      const oldest = await db.entries.orderBy("lastAccessedAt").limit(toDelete).primaryKeys();
      await db.entries.bulkDelete(oldest as string[]);
    }
  } catch {
    // Quota exceeded, private browsing, etc. — degrade silently.
  }
}
