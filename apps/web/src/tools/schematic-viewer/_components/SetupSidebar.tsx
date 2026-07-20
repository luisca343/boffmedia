"use client";

import { useTranslations } from "next-intl";
import { Banner, DataList, Select, Spinner } from "@/components/boffmedia/primitives";
import { SchematicFilePicker } from "@/components/boffmedia/ui/schematic";
import { BUNDLED_VERSIONS } from "@/lib/schematic/versions";
import { selectEnvironment, useViewerStore } from "../_store/viewer.store";

interface SetupSidebarProps {
  engineReady: boolean;
  onPickSchematic: (file: File) => void;
  onChangeVersion: (version: string) => void;
}

/** `error.*` message keys, by machine code. Uncoded failures show raw detail. */
const ERROR_KEY: Record<string, string> = {
  E_SCHEMATIC_UNSUPPORTED: "error.schematicUnsupported",
  E_SCHEMATIC_LEGACY: "error.schematicLegacy",
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
}: SetupSidebarProps) {
  const t = useTranslations("games.minecraft.schematicViewer");
  const env = useViewerStore(selectEnvironment);
  const schematic = useViewerStore((s) => s.schematic);
  const isLoadingSchematic = useViewerStore((s) => s.isLoadingSchematic);
  const error = useViewerStore((s) => s.error);
  const errorCode = useViewerStore((s) => s.errorCode);

  const errorText = errorCode && ERROR_KEY[errorCode] ? t(ERROR_KEY[errorCode]) : error;

  return (
    <div className="flex flex-col gap-4 p-4 pb-[22px]">
      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.version")} />
        <Select
          value={env.vanillaVersion}
          options={[...BUNDLED_VERSIONS]}
          disabled={!engineReady || env.isLoading}
          ariaLabel={t("setup.version")}
          onChange={onChangeVersion}
        />
        {env.isLoading ? (
          <div className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
            <Spinner size={13} />
            {t("setup.loadingRegistry")}
          </div>
        ) : env.registry ? (
          <DataList
            rows={[
              { label: t("setup.registry"), value: t("setup.vanillaRegistry") },
              { label: t("setup.blocks"), value: env.registry.blockCount.toLocaleString(), mono: true },
            ]}
          />
        ) : null}
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
            ]}
          />
        </div>
      )}
    </div>
  );
}
