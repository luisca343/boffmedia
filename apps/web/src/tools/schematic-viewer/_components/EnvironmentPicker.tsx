"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Banner, DataList, Select, Seg, Spinner } from "@/components/boffmedia/primitives";
import { BUNDLED_VERSIONS } from "@/lib/schematic/versions";
import {
  collectFromDirectory,
  collectFromFileList,
  getDirectoryPicker,
} from "@/lib/schematic/registry/instance-files";
import { selectEnvironment, useViewerStore } from "../_store/viewer.store";
import type { EnvMode } from "@/lib/schematic/state";

interface EnvironmentPickerProps {
  engineReady: boolean;
  onChangeVersion: (version: string) => void;
  onChangeMode: (mode: EnvMode) => void;
  onScanInstance: (files: File[]) => void;
}

/**
 * Where the block definitions and textures come from: a bundled vanilla version,
 * or a real install.
 *
 * The scan is not a power-user extra — a mod's textures ship inside its JAR and
 * nowhere else, so a modded build viewed against a vanilla registry is a field
 * of placeholder cubes no matter how well its blocks were named.
 */
export function EnvironmentPicker({
  engineReady,
  onChangeVersion,
  onChangeMode,
  onScanInstance,
}: EnvironmentPickerProps) {
  const t = useTranslations("games.minecraft.schematicViewer");
  const env = useViewerStore(selectEnvironment);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolved after mount, never during render: reading `window` inline makes the
  // server (always false) and the client (usually true) disagree on the input's
  // attributes, which React reports as a hydration mismatch.
  const [hasFsApi, setHasFsApi] = useState(false);
  useEffect(() => {
    setHasFsApi(!!getDirectoryPicker());
  }, []);
  useEffect(() => {
    if (!hasFsApi && inputRef.current) {
      inputRef.current.setAttribute("webkitdirectory", "");
      inputRef.current.setAttribute("directory", "");
    }
  }, [hasFsApi]);

  const busy = !engineReady || env.isLoading;

  async function pickInstance() {
    if (busy) return;
    const picker = getDirectoryPicker();
    if (!picker) {
      inputRef.current?.click();
      return;
    }
    try {
      const dir = await picker();
      onScanInstance(await collectFromDirectory(dir, env.game));
    } catch {
      // User dismissed the picker — nothing to do.
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Seg
        options={[
          { value: "vanilla", label: t("setup.modeVanilla") },
          { value: "instance", label: t("setup.modeInstance") },
        ]}
        value={env.envMode}
        onChange={(v) => !busy && onChangeMode(v as EnvMode)}
      />

      {env.envMode === "vanilla" ? (
        <Select
          value={env.vanillaVersion}
          options={[...BUNDLED_VERSIONS]}
          disabled={busy}
          ariaLabel={t("setup.version")}
          onChange={onChangeVersion}
        />
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) onScanInstance(collectFromFileList(files, env.game));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="cut-tag [--cut-tag:7px] bg-panel border border-line-2 px-3 py-2.5 text-left font-mono text-[11.5px] text-txt hover:border-accent hover:bg-accent-soft disabled:opacity-50"
            onClick={pickInstance}
            disabled={busy}
          >
            {t("setup.pickInstance")}
          </button>
          <p className="font-mono text-[11px] leading-relaxed text-txt-dim">
            {t("setup.instanceHint")}
          </p>
        </>
      )}

      {env.scan ? (
        <div className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
          <Spinner size={13} />
          {env.scan.msg}
        </div>
      ) : env.isLoading ? (
        <div className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
          <Spinner size={13} />
          {t("setup.loadingRegistry")}
        </div>
      ) : env.registry ? (
        <DataList
          rows={[
            {
              label: t("setup.registry"),
              value: env.registry.instanceName ?? t("setup.vanillaRegistry"),
            },
            { label: t("setup.version"), value: env.registry.version, mono: true },
            env.registry.mods.length > 0 && {
              label: t("setup.mods"),
              value: String(env.registry.mods.length),
              mono: true,
            },
            {
              label: t("setup.blocks"),
              value: env.registry.blockCount.toLocaleString(),
              mono: true,
            },
            // The number that predicts what the 3D view will look like: 0 after
            // an instance scan means every mod block will be a placeholder cube.
            env.registry.source === "scanned" && {
              label: t("setup.texturesLabel"),
              value: env.registry.textureCount.toLocaleString(),
              mono: true,
            },
          ]}
        />
      ) : null}
      {env.registry?.source === "scanned" && !env.isLoading && (
        <>
          {(env.registry.failedJars ?? 0) > 0 && (
            <Banner tone="warn" className="text-[12.5px]">
              {t("setup.failedJars", { count: env.registry.failedJars ?? 0 })}
            </Banner>
          )}
          {env.registry.textureCount === 0 && (
            <Banner tone="warn" className="text-[12.5px]">
              {t("setup.noTextures")}
            </Banner>
          )}
        </>
      )}
    </div>
  );
}
