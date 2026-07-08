"use client";

import { useEffect, useRef } from "react";
import { ScanCard, type SchRegistry } from "../ui/sch-kit";
import type { RegistryHandle } from "../../_lib/types";
import type { GameId } from "../../_lib/adapters";

interface ScanProgress {
  pct: number;
  msg: string;
}

interface EnvPickerProps {
  role: "source" | "target";
  roleLabel: string;
  game: GameId;
  onGameChange: (g: GameId) => void;
  registry?: RegistryHandle;
  scan?: ScanProgress;
  loading: boolean;
  disabled: boolean;
  onPick: (files: File[]) => void;
}

const META_NAMES = new Set(["minecraftinstance.json", "manifest.json"]);
/** Hytale install path under the picked folder; tried first for a fast lookup. */
const HYTALE_PATH = ["install", "release", "package", "game", "latest"];
/** Bound the recursive Assets.zip search so we never walk the whole install. */
const MAX_DIRS_SCANNED = 400;

// Minimal structural typing for the File System Access API — not in the default
// TS DOM lib across versions, so we declare just what we use.
interface FsFileHandle {
  kind: "file";
  getFile(): Promise<File>;
}
interface FsDirHandle {
  kind: "directory";
  entries(): AsyncIterableIterator<[string, FsFileHandle | FsDirHandle]>;
  getDirectoryHandle(name: string): Promise<FsDirHandle>;
  getFileHandle(name: string): Promise<FsFileHandle>;
}
type ShowDirectoryPicker = () => Promise<FsDirHandle>;

function getDirectoryPicker(): ShowDirectoryPicker | undefined {
  return (window as unknown as { showDirectoryPicker?: ShowDirectoryPicker }).showDirectoryPicker;
}

/** Walk a Minecraft instance dir, collecting launcher metadata + every mods/*.jar. */
async function collectMinecraft(dir: FsDirHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir.entries()) {
    const lower = name.toLowerCase();
    if (handle.kind === "file" && META_NAMES.has(lower)) {
      files.push(await handle.getFile());
    } else if (handle.kind === "directory" && lower === "mods") {
      for await (const [jarName, jarHandle] of handle.entries()) {
        if (jarHandle.kind === "file" && jarName.toLowerCase().endsWith(".jar")) {
          files.push(await jarHandle.getFile());
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
async function collectHytale(dir: FsDirHandle): Promise<File[]> {
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

/** Fallback for browsers without the File System Access API: split a FileList. */
function collectFromFileList(files: FileList, game: GameId): File[] {
  const list = Array.from(files);
  if (game === "hytale") {
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
    if (META_NAMES.has(base)) {
      out.push(file);
    } else if (base.endsWith(".jar") && segments.some((s) => s.toLowerCase() === "mods")) {
      out.push(file);
    }
  }
  return out;
}

/** Map the worker registry handle to the presentational ScanCard registry shape. */
function toScanRegistry(h: RegistryHandle | undefined): SchRegistry | null {
  if (!h) return null;
  return {
    name: h.instanceName,
    version: h.version,
    loader: h.modLoader,
    mods: h.mods.length,
    blocks: h.blockCount,
  };
}

/**
 * Environment picker rendered with the {@link ScanCard} design piece, preserving
 * the File System Access API flow: Minecraft picks an instance folder (metadata +
 * mods/*.jar); Hytale picks the install folder (or Assets.zip directly). Falls
 * back to `<input webkitdirectory>` / a `.zip` input where the API is missing.
 */
export function EnvPicker({
  role,
  roleLabel,
  game,
  onGameChange,
  registry,
  scan,
  loading,
  disabled,
  onPick,
}: EnvPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFsApi = typeof window !== "undefined" && !!getDirectoryPicker();
  const fallbackIsFolder = !hasFsApi && game === "minecraft";

  useEffect(() => {
    if (inputRef.current) {
      if (fallbackIsFolder) {
        inputRef.current.setAttribute("webkitdirectory", "");
        inputRef.current.setAttribute("directory", "");
      } else {
        inputRef.current.removeAttribute("webkitdirectory");
        inputRef.current.removeAttribute("directory");
      }
    }
  }, [fallbackIsFolder]);

  async function handleClick() {
    if (disabled || loading) return;
    if (hasFsApi) {
      const picker = getDirectoryPicker();
      if (!picker) return;
      try {
        const dir = await picker();
        const files = game === "hytale" ? await collectHytale(dir) : await collectMinecraft(dir);
        onPick(files);
      } catch {
        // User dismissed the picker — nothing to do.
      }
      return;
    }
    inputRef.current?.click();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={fallbackIsFolder}
        accept={game === "hytale" && !hasFsApi ? ".zip" : undefined}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length) onPick(collectFromFileList(files, game));
          e.target.value = "";
        }}
      />
      <ScanCard
        role={role}
        roleLabel={roleLabel}
        game={game}
        onGame={(g) => onGameChange(g as GameId)}
        registry={toScanRegistry(registry)}
        scanning={loading}
        progress={scan?.pct ?? 0}
        onPick={handleClick}
      />
    </>
  );
}
