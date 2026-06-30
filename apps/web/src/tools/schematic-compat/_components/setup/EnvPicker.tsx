"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen, Boxes, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import type { RegistryHandle } from "../../_lib/types";
import type { GameId } from "../../_lib/adapters";

interface ScanProgress {
  pct: number;
  msg: string;
}

interface EnvPickerProps {
  label: string;
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
 * path first (`install/release/package/game/latest`), then a bounded
 * breadth-first search so an arbitrary parent folder still works without walking
 * the entire ~GB install tree.
 */
async function collectHytale(dir: FsDirHandle): Promise<File[]> {
  // Maybe the user picked the folder that directly holds Assets.zip.
  const direct = await findAssetsInDir(dir);
  if (direct) return [direct];

  // Fast path: descend the known Hytale layout.
  try {
    let cur = dir;
    for (const seg of HYTALE_PATH) cur = await cur.getDirectoryHandle(seg);
    const found = await findAssetsInDir(cur);
    if (found) return [found];
  } catch {
    // Layout differs — fall back to a bounded search.
  }

  // Bounded BFS.
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
    const zip = list.find((f) => f.name.toLowerCase() === "assets.zip")
      ?? list.filter((f) => f.name.toLowerCase().endsWith(".zip")).sort((a, b) => b.size - a.size)[0];
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

const GAME_ICON: Record<GameId, typeof Boxes> = { minecraft: Boxes, hytale: Gamepad2 };

/**
 * Environment picker with a per-environment game toggle.
 *
 * Minecraft: pick a real instance folder; the worker detects version/loader and
 * scans `mods/*.jar`. Hytale: pick the install folder (or Assets.zip directly);
 * the worker reads the block catalog from Assets.zip's central directory.
 *
 * Prefers the File System Access API so only the relevant files are read; falls
 * back to `<input webkitdirectory>` / a `.zip` file input where it's missing.
 */
export function EnvPicker({
  label,
  game,
  onGameChange,
  registry,
  scan,
  loading,
  disabled,
  onPick,
}: EnvPickerProps) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFsApi = typeof window !== "undefined" && !!getDirectoryPicker();
  // Hytale fallback picks the Assets.zip file; Minecraft fallback picks a folder.
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

  const pickLabel = game === "hytale" ? t("setup.pickHytale") : t("setup.pickInstance");

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink-muted">{label}</label>

      {/* Per-environment game toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        {(["minecraft", "hytale"] as GameId[]).map((g) => {
          const Icon = GAME_ICON[g];
          const active = game === g;
          return (
            <button
              key={g}
              type="button"
              disabled={disabled || loading}
              onClick={() => onGameChange(g)}
              aria-pressed={active}
              className={[
                "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors",
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-edge/40 text-muted-foreground hover:border-edge hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">{t(`game.${g}`)}</span>
            </button>
          );
        })}
      </div>

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

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start h-9"
        disabled={disabled || loading}
        onClick={handleClick}
      >
        <FolderOpen className="w-4 h-4 mr-2" />
        {loading ? "…" : pickLabel}
      </Button>

      <div className="text-[11px] text-ink-dim min-h-[16px]">
        {loading ? (
          <span className="block truncate">
            {scan && scan.pct > 0 ? `${scan.pct}% · ${scan.msg}` : t("setup.scanning")}
          </span>
        ) : registry ? (
          <span className="block text-success">
            ✓ {registry.instanceName ? `${registry.instanceName} · ` : ""}
            {registry.version}
            {registry.modLoader ? ` · ${registry.modLoader}` : ""} ·{" "}
            {registry.mods.length} {t("setup.modsLabel")} · {registry.blockCount}{" "}
            {t("setup.blocksLabel")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
