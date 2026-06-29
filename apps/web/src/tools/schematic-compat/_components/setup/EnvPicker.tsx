"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import type { RegistryHandle } from "../../_lib/types";

interface ScanProgress {
  pct: number;
  msg: string;
}

interface EnvPickerProps {
  label: string;
  registry?: RegistryHandle;
  scan?: ScanProgress;
  loading: boolean;
  disabled: boolean;
  onPick: (metaFiles: File[], jarFiles: File[]) => void;
}

const META_NAMES = new Set(["minecraftinstance.json", "manifest.json"]);

// Minimal structural typing for the File System Access API — not in the default
// TS DOM lib across versions, so we declare just what we use.
interface FsFileHandle {
  kind: "file";
  getFile(): Promise<File>;
}
interface FsDirHandle {
  kind: "directory";
  entries(): AsyncIterableIterator<[string, FsFileHandle | FsDirHandle]>;
}
type ShowDirectoryPicker = () => Promise<FsDirHandle>;

function getDirectoryPicker(): ShowDirectoryPicker | undefined {
  return (window as unknown as { showDirectoryPicker?: ShowDirectoryPicker }).showDirectoryPicker;
}

/**
 * Walk a picked instance directory and collect ONLY the files needed to build a
 * registry: the launcher metadata file plus every `mods/*.jar`. This reads the
 * top level and the `mods/` folder lazily — it never enumerates `saves/`,
 * resource packs, etc., so there is no whole-folder upload prompt.
 */
async function collectFromHandle(dir: FsDirHandle): Promise<{ metaFiles: File[]; jarFiles: File[] }> {
  const metaFiles: File[] = [];
  const jarFiles: File[] = [];

  for await (const [name, handle] of dir.entries()) {
    const lower = name.toLowerCase();
    if (handle.kind === "file" && META_NAMES.has(lower)) {
      metaFiles.push(await handle.getFile());
    } else if (handle.kind === "directory" && lower === "mods") {
      for await (const [jarName, jarHandle] of handle.entries()) {
        if (jarHandle.kind === "file" && jarName.toLowerCase().endsWith(".jar")) {
          jarFiles.push(await jarHandle.getFile());
        }
      }
    }
  }

  return { metaFiles, jarFiles };
}

/** Fallback for browsers without the File System Access API: split a FileList. */
function collectFromFileList(files: FileList): { metaFiles: File[]; jarFiles: File[] } {
  const metaFiles: File[] = [];
  const jarFiles: File[] = [];

  for (const file of Array.from(files)) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const segments = rel.split("/");
    const base = segments[segments.length - 1].toLowerCase();
    if (META_NAMES.has(base)) {
      metaFiles.push(file);
    } else if (base.endsWith(".jar") && segments.some((s) => s.toLowerCase() === "mods")) {
      jarFiles.push(file);
    }
  }

  return { metaFiles, jarFiles };
}

/**
 * Environment picker: select a real Minecraft instance folder. The version,
 * mod loader, and full block set (vanilla + mods) are detected by scanning the
 * folder's `mods/*.jar` files and launcher metadata in the worker.
 *
 * Prefers the File System Access API (`showDirectoryPicker`) so only `mods/` and
 * the metadata file are read — no whole-folder upload prompt. Falls back to an
 * `<input webkitdirectory>` on browsers that lack it (Firefox/Safari).
 */
export function EnvPicker({ label, registry, scan, loading, disabled, onPick }: EnvPickerProps) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFsApi = typeof window !== "undefined" && !!getDirectoryPicker();

  // `webkitdirectory` isn't in React's input typings — set it imperatively
  // (only used on the fallback path).
  useEffect(() => {
    if (!hasFsApi && inputRef.current) {
      inputRef.current.setAttribute("webkitdirectory", "");
      inputRef.current.setAttribute("directory", "");
    }
  }, [hasFsApi]);

  async function handleClick() {
    if (hasFsApi) {
      const picker = getDirectoryPicker();
      if (!picker) return;
      try {
        const dir = await picker();
        const { metaFiles, jarFiles } = await collectFromHandle(dir);
        onPick(metaFiles, jarFiles);
      } catch {
        // User dismissed the picker — nothing to do.
      }
      return;
    }
    inputRef.current?.click();
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink-muted">{label}</label>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length) {
            const { metaFiles, jarFiles } = collectFromFileList(files);
            onPick(metaFiles, jarFiles);
          }
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
        {loading ? "…" : t("setup.pickInstance")}
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
