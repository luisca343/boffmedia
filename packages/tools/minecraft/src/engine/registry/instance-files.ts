/**
 * Collecting the files an environment scan needs out of a picked game folder.
 *
 * Pure browser-API logic, no React and no strings: every schematic tool that
 * offers "point at your install" walks the same launcher layouts, so the walk
 * lives here and each tool keeps only its own picker UI.
 *
 * Minecraft wants launcher metadata plus every `mods/*.jar`; Hytale wants the
 * install's `Assets.zip`. Both fall back to a plain `<input>` selection where
 * the File System Access API is unavailable.
 */
import { gameMeta, type GameId } from "../adapters/game-adapter";
import { INSTANCE_META_FILENAMES } from "./loader-detect";

const META_NAMES = new Set<string>(INSTANCE_META_FILENAMES);

/**
 * Launchers that keep the game files in a subfolder rather than at the instance
 * root: MultiMC/Prism use `minecraft/` (or `.minecraft/`), so `mods/` lives one
 * level down while the metadata stays at the root.
 */
const GAME_SUBDIRS = new Set([".minecraft", "minecraft"]);
/** Hytale install path under the picked folder; tried first for a fast lookup. */
const HYTALE_PATH = ["install", "release", "package", "game", "latest"];
/** Bound the recursive Assets.zip search so we never walk the whole install. */
const MAX_DIRS_SCANNED = 400;

// Minimal structural typing for the File System Access API — not in the default
// TS DOM lib across versions, so we declare just what we use.
export interface FsFileHandle {
  kind: "file";
  getFile(): Promise<File>;
}
export interface FsDirHandle {
  kind: "directory";
  entries(): AsyncIterableIterator<[string, FsFileHandle | FsDirHandle]>;
  getDirectoryHandle(name: string): Promise<FsDirHandle>;
  getFileHandle(name: string): Promise<FsFileHandle>;
}
export type ShowDirectoryPicker = () => Promise<FsDirHandle>;

export function getDirectoryPicker(): ShowDirectoryPicker | undefined {
  return (window as unknown as { showDirectoryPicker?: ShowDirectoryPicker }).showDirectoryPicker;
}

async function collectJars(modsDir: FsDirHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [jarName, jarHandle] of modsDir.entries()) {
    if (jarHandle.kind === "file" && jarName.toLowerCase().endsWith(".jar")) {
      files.push(await jarHandle.getFile());
    }
  }
  return files;
}

/**
 * Walk a Minecraft instance dir, collecting launcher metadata + every
 * `mods/*.jar`. Descends one level into a `minecraft/` / `.minecraft/` game
 * folder so MultiMC/Prism layouts (metadata at the root, mods one level down)
 * work as well as the flat CurseForge one.
 */
export async function collectMinecraft(dir: FsDirHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir.entries()) {
    const lower = name.toLowerCase();
    if (handle.kind === "file" && META_NAMES.has(lower)) {
      files.push(await handle.getFile());
    } else if (handle.kind === "directory" && lower === "mods") {
      files.push(...(await collectJars(handle)));
    } else if (handle.kind === "directory" && GAME_SUBDIRS.has(lower)) {
      for await (const [innerName, innerHandle] of handle.entries()) {
        const innerLower = innerName.toLowerCase();
        if (innerHandle.kind === "directory" && innerLower === "mods") {
          files.push(...(await collectJars(innerHandle)));
        } else if (innerHandle.kind === "file" && META_NAMES.has(innerLower)) {
          files.push(await innerHandle.getFile());
        }
      }
    }
  }
  return files;
}

async function findAssetsInDir(dir: FsDirHandle): Promise<File | null> {
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file" && name.toLowerCase() === "assets.zip") {
      return handle.getFile();
    }
  }
  return null;
}

/**
 * Locate Hytale's Assets.zip under the picked folder. Tries the known install
 * path first, then a bounded breadth-first search so an arbitrary parent folder
 * still works without walking the entire ~GB install tree.
 */
export async function collectHytale(dir: FsDirHandle): Promise<File[]> {
  const direct = await findAssetsInDir(dir);
  if (direct) return [direct];

  try {
    let cur = dir;
    for (const seg of HYTALE_PATH) cur = await cur.getDirectoryHandle(seg);
    const found = await findAssetsInDir(cur);
    if (found) return [found];
  } catch {
    // Layout differs — fall back to a bounded search.
  }

  const queue: FsDirHandle[] = [dir];
  let scanned = 0;
  while (queue.length > 0 && scanned < MAX_DIRS_SCANNED) {
    const d = queue.shift()!;
    scanned++;
    for await (const [name, handle] of d.entries()) {
      if (handle.kind === "file" && name.toLowerCase() === "assets.zip") {
        return [await handle.getFile()];
      }
      if (handle.kind === "directory") queue.push(handle);
    }
  }
  return [];
}

/** Walk a picked directory for whichever files this game's registry builder needs. */
export function collectFromDirectory(dir: FsDirHandle, game: GameId): Promise<File[]> {
  return gameMeta(game).pickerKind === "asset-archive"
    ? collectHytale(dir)
    : collectMinecraft(dir);
}

/** Fallback for browsers without the File System Access API: split a FileList. */
export function collectFromFileList(files: FileList, game: GameId): File[] {
  const list = Array.from(files);
  if (gameMeta(game).pickerKind === "asset-archive") {
    const zip =
      list.find((f) => f.name.toLowerCase() === "assets.zip") ??
      list.filter((f) => f.name.toLowerCase().endsWith(".zip")).sort((a, b) => b.size - a.size)[0];
    return zip ? [zip] : [];
  }
  const out: File[] = [];
  for (const file of list) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const segments = rel.split("/");
    const base = segments[segments.length - 1].toLowerCase();
    // Metadata may sit at the instance root or inside the game subfolder; a
    // recursive directory input reports both, and either is fine.
    if (META_NAMES.has(base)) {
      out.push(file);
    } else if (base.endsWith(".jar") && segments.some((s) => s.toLowerCase() === "mods")) {
      out.push(file);
    }
  }
  return out;
}
