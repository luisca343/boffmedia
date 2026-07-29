"use client";

import { useEffect, useRef, useState } from "react";
import { ScanCard } from "./ScanCard";
import type { SchRegistry } from "../ui/sch-tokens";
import type { RegistryHandle } from "@/lib/schematic/types";
import { gameMeta, type GameId } from "@/lib/schematic/adapters/game-adapter";
import type { EnvMode } from "../../_store/tool.store";
import { BUNDLED_VERSIONS } from "@/lib/schematic/versions";
import {
  collectFromDirectory,
  collectFromFileList,
  getDirectoryPicker,
} from "@/lib/schematic/registry/instance-files";

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
  mode: EnvMode;
  onModeChange: (m: EnvMode) => void;
  vanillaVersion: string;
  onVanillaVersionChange: (v: string) => void;
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
    bundled: h.source === "bundled",
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
  mode,
  onModeChange,
  vanillaVersion,
  onVanillaVersionChange,
}: EnvPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Resolved after mount, never during render: reading `window` inline makes the
  // server (always false) and the client (usually true) disagree on the input's
  // `multiple`, which React reports as a hydration mismatch.
  const [hasFsApi, setHasFsApi] = useState(false);
  useEffect(() => {
    setHasFsApi(!!getDirectoryPicker());
  }, []);
  const meta = gameMeta(game);
  const fallbackIsFolder = !hasFsApi && meta.pickerKind === "instance-folder";

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
        onPick(await collectFromDirectory(dir, game));
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
        accept={!hasFsApi ? meta.fallbackAccept : undefined}
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
        // A game without bundled registries must scan its install.
        mode={meta.hasBundledRegistries ? mode : "instance"}
        onMode={meta.hasBundledRegistries ? onModeChange : undefined}
        versions={BUNDLED_VERSIONS}
        version={vanillaVersion}
        onVersion={onVanillaVersionChange}
      />
    </>
  );
}
