"use client";

import { useToolT } from "../../i18n";
import { Banner, DataList, Spinner } from "@boffmedia/ui";
import { SchematicFilePicker, WorldIdPicker } from "../../ui";
import type { EnvMode } from "../../engine/state";
import { useViewerStore } from "../_store/viewer.store";
import { EnvironmentPicker } from "./EnvironmentPicker";

interface SetupSidebarProps {
  engineReady: boolean;
  onPickSchematic: (file: File) => void;
  onChangeVersion: (version: string) => void;
  onPickWorld: (file: File) => void;
  onDetachWorld: () => void;
  onChangeMode: (mode: EnvMode) => void;
  onScanInstance: (files: File[]) => void;
}

/** `error.*` message keys, by machine code. Uncoded failures show raw detail. */
const ERROR_KEY: Record<string, string> = {
  E_SCHEMATIC_UNSUPPORTED: "error.schematicUnsupported",
  E_LEVELDAT_UNREADABLE: "error.levelDatUnreadable",
  E_LEVELDAT_NO_REGISTRY: "error.levelDatNoRegistry",
};

function GroupHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-txt-muted">
        {title}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** The whole input surface of the tool: a version, then a file. */
export function SetupSidebar({
  engineReady,
  onPickSchematic,
  onChangeVersion,
  onPickWorld,
  onDetachWorld,
  onChangeMode,
  onScanInstance,
}: SetupSidebarProps) {
  const t = useToolT("tools.schematicViewer");
  const schematic = useViewerStore((s) => s.schematic);
  const isLoadingSchematic = useViewerStore((s) => s.isLoadingSchematic);
  const worldIds = useViewerStore((s) => s.worldIds);
  const error = useViewerStore((s) => s.error);
  const errorCode = useViewerStore((s) => s.errorCode);

  const errorText = errorCode && ERROR_KEY[errorCode] ? t(ERROR_KEY[errorCode]) : error;

  return (
    <div className="flex flex-col gap-4 p-4 pb-[22px]">
      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.environment")} />
        <EnvironmentPicker
          engineReady={engineReady}
          onChangeVersion={onChangeVersion}
          onChangeMode={onChangeMode}
          onScanInstance={onScanInstance}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.schematic")} />
        <SchematicFilePicker
          schematic={schematic}
          labels={{ dropHere: t("setup.dropHere"), loaded: t("setup.loaded") }}
          disabled={!engineReady || isLoadingSchematic}
          onPick={onPickSchematic}
        />
        {isLoadingSchematic && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
            <Spinner size={13} />
            {t("setup.parsing")}
          </div>
        )}
      </div>

      {errorText && (
        <Banner tone="error" className="text-[12.5px]">
          {errorText}
        </Banner>
      )}

      {/* Only pre-flattening documents carry numeric ids, so this step exists
          only for them — a modern file needs no world to be named. */}
      {schematic?.legacy && (
        <div className="flex flex-col gap-2.5">
          <GroupHead title={t("setup.world")} />
          <WorldIdPicker
            worldIds={worldIds}
            unknownIdCount={schematic.unknownIdCount ?? 0}
            disabled={!engineReady || isLoadingSchematic}
            labels={{
              dropHere: t("setup.worldDropHere"),
              hint: t("setup.worldHint"),
              loaded: t("setup.loaded"),
              world: t("setup.worldName"),
              ids: t("setup.worldModdedIds"),
              mods: t("setup.worldMods"),
              unresolved: t("setup.worldUnresolved", { count: schematic.unknownIdCount ?? 0 }),
              needed: t("setup.worldNeeded", { count: schematic.unknownIdCount ?? 0 }),
              caveat: t("setup.worldCaveat"),
              detach: t("setup.worldDetach"),
            }}
            onPick={onPickWorld}
            onDetach={onDetachWorld}
          />
        </div>
      )}

      {schematic && (
        <div className="flex flex-col gap-2.5">
          <GroupHead title={t("setup.details")} />
          <DataList
            rows={[
              { label: t("setup.format"), value: schematic.format, mono: true },
              {
                label: t("setup.size"),
                value: `${schematic.dimensions.x}×${schematic.dimensions.y}×${schematic.dimensions.z}`,
                mono: true,
              },
              { label: t("setup.palette"), value: schematic.paletteSize.toLocaleString(), mono: true },
              !!schematic.littleTiles && {
                label: t("setup.littleTiles"),
                value: t("setup.littleTilesCount", {
                  blocks: schematic.littleTiles.blockCount,
                  tiles: schematic.littleTiles.tileCount,
                }),
                mono: true,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
