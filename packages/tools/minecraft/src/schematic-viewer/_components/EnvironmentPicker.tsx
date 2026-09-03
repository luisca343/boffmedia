"use client";

import { useToolT } from "../../i18n";
import { Banner, DataList, Select, Seg, Spinner } from "@boffmedia/ui";
import { BUNDLED_VERSIONS } from "../../engine/versions";
import { useInstanceFilePicker } from "../../engine/actions";
import { selectEnvironment, useViewerStore } from "../_store/viewer.store";
import type { EnvMode } from "../../engine/state";

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
  const t = useToolT("tools.schematicViewer");
  const env = useViewerStore(selectEnvironment);
  const { inputRef, inputProps, pick } = useInstanceFilePicker({
    game: env.game,
    onPick: onScanInstance,
  });

  const busy = !engineReady || env.isLoading;

  async function pickInstance() {
    if (busy) return;
    await pick();
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
            {...inputProps}
            className="hidden"
          />
          <button
            type="button"
            className="cut-tag cut-tag-edge hover:[--cut-line:var(--accent)] [--cut-line:var(--line-2)] [--cut-tag:7px] bg-panel border border-line-2 px-3 py-2.5 text-left font-mono text-[0.71875rem] text-txt hover:border-accent hover:bg-accent-soft disabled:opacity-50"
            onClick={pickInstance}
            disabled={busy}
          >
            {t("setup.pickInstance")}
          </button>
          <p className="font-mono text-[0.6875rem] leading-relaxed text-txt-dim">
            {t("setup.instanceHint")}
          </p>
        </>
      )}

      {env.scan ? (
        <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-txt-dim">
          <Spinner size={13} />
          {env.scan.msg}
        </div>
      ) : env.isLoading ? (
        <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-txt-dim">
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
            <Banner tone="warn" className="text-[0.78125rem]">
              {t("setup.failedJars", { count: env.registry.failedJars ?? 0 })}
            </Banner>
          )}
          {env.registry.textureCount === 0 && (
            <Banner tone="warn" className="text-[0.78125rem]">
              {t("setup.noTextures")}
            </Banner>
          )}
        </>
      )}
    </div>
  );
}
