"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, Banner, Disclosure, Icon } from "@/components/boffmedia/primitives";
import { SchematicFilePicker, WorldIdPicker } from "@/components/boffmedia/ui/schematic";
import { gameMeta, type GameId } from "@/lib/schematic/adapters/game-adapter";
import { selectEnv, useToolStore, type EnvMode, type EnvRole } from "../../_store/tool.store";
import { EnvPicker } from "./EnvPicker";
import { ManualEnvDialog, type ManualEnvChoice } from "./ManualEnvDialog";

interface SetupPanelProps {
  engineReady: boolean;
  onScanSource: (gameId: GameId, files: File[]) => void;
  onScanTarget: (gameId: GameId, files: File[]) => void;
  onChangeSourceGame: (gameId: GameId) => void;
  onChangeTargetGame: (gameId: GameId) => void;
  onLoadVanilla: (role: EnvRole, version: string) => void;
  onRetryPendingScan: (choice: ManualEnvChoice) => void;
  onCancelPendingScan: () => void;
  onPickSchematic: (file: File) => void;
  onPickWorld: (file: File) => void;
  onDetachWorld: () => void;
  onAnalyze: () => void;
}

/** `error.*` message keys, by machine code. Uncoded failures show raw detail. */
const ERROR_KEY: Record<string, string> = {
  E_INSTANCE_EMPTY: "error.instanceEmpty",
  E_SCHEMATIC_UNSUPPORTED: "error.schematicUnsupported",
  E_LEVELDAT_UNREADABLE: "error.levelDatUnreadable",
  E_LEVELDAT_NO_REGISTRY: "error.levelDatNoRegistry",
  E_EXPORT_TOO_LARGE: "error.exportTooLarge",
};

function GroupHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-txt-muted">{title}</span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

export function SetupPanel({
  engineReady,
  onScanSource,
  onScanTarget,
  onChangeSourceGame,
  onChangeTargetGame,
  onLoadVanilla,
  onRetryPendingScan,
  onCancelPendingScan,
  onPickSchematic,
  onPickWorld,
  onDetachWorld,
  onAnalyze,
}: SetupPanelProps) {
  // Selectors, not a bare `useToolStore()`: an unselected subscription re-renders
  // this panel on every scan-progress tick.
  const source = useToolStore(selectEnv("source"));
  const target = useToolStore(selectEnv("target"));
  const schematic = useToolStore((s) => s.schematic);
  const worldIds = useToolStore((s) => s.worldIds);
  const pendingScan = useToolStore((s) => s.pendingScan);
  const isAnalyzing = useToolStore((s) => s.isAnalyzing);
  const diff = useToolStore((s) => s.diff);
  const error = useToolStore((s) => s.error);
  const errorCode = useToolStore((s) => s.errorCode);
  const setEnvMode = useToolStore((s) => s.setEnvMode);
  const setVanillaVersion = useToolStore((s) => s.setVanillaVersion);
  const t = useTranslations("games.minecraft.schematicCompat");

  // A vanilla environment needs no picker interaction — selecting the mode (or a
  // different version) IS the choice, so build the registry as soon as it changes.
  useEffect(() => {
    if (engineReady && gameMeta(source.game).hasBundledRegistries && source.envMode === "vanilla") {
      onLoadVanilla("source", source.vanillaVersion);
    }
    // onLoadVanilla is stable (useCallback in useToolActions).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady, source.game, source.envMode, source.vanillaVersion]);

  useEffect(() => {
    if (engineReady && gameMeta(target.game).hasBundledRegistries && target.envMode === "vanilla") {
      onLoadVanilla("target", target.vanillaVersion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady, target.game, target.envMode, target.vanillaVersion]);

  const errorText = errorCode && ERROR_KEY[errorCode] ? t(ERROR_KEY[errorCode]) : error;

  const guideSteps = [t("guide.step1"), t("guide.step2"), t("guide.step3"), t("guide.step4"), t("guide.step5")];

  const analyzed = !!diff;
  const canAnalyze = engineReady && !!schematic && !!source.registry && !!target.registry && !isAnalyzing && !analyzed;

  return (
    <div className="p-4 pb-[22px] flex flex-col gap-4">
      {/* onboarding guide */}
      <Disclosure title={t("guide.title")} icon="info" defaultOpen={false}>
        <ol className="mt-1 p-0 list-none grid gap-[9px]">
          {guideSteps.map((tt, i) => (
            <li key={i} className="flex gap-[9px] items-start text-[12.5px] text-txt-muted leading-[1.4]">
              <span className="grid place-items-center w-[18px] h-[18px] shrink-0 mt-px font-mono text-[10px] font-semibold bg-accent-soft text-accent-bright border border-solid border-accent-line">
                {i + 1}
              </span>
              <span>{tt}</span>
            </li>
          ))}
        </ol>
      </Disclosure>

      {/* environments */}
      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.environments")} />
        <EnvPicker
          role="source"
          roleLabel={t("setup.source")}
          game={source.game}
          onGameChange={onChangeSourceGame}
          registry={source.registry}
          scan={source.scan}
          loading={source.isLoading}
          disabled={!engineReady}
          onPick={(files) => onScanSource(source.game, files)}
          mode={source.envMode}
          onModeChange={(m: EnvMode) => setEnvMode("source", m)}
          vanillaVersion={source.vanillaVersion}
          onVanillaVersionChange={(v) => setVanillaVersion("source", v)}
        />
        <div className="flex items-center justify-center gap-2 text-txt-dim py-px px-1">
          <span className="flex-1 h-px bg-line" />
          <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} />
          <span className="flex-1 h-px bg-line" />
        </div>
        <EnvPicker
          role="target"
          roleLabel={t("setup.target")}
          game={target.game}
          onGameChange={onChangeTargetGame}
          registry={target.registry}
          scan={target.scan}
          loading={target.isLoading}
          disabled={!engineReady}
          onPick={(files) => onScanTarget(target.game, files)}
          mode={target.envMode}
          onModeChange={(m: EnvMode) => setEnvMode("target", m)}
          vanillaVersion={target.vanillaVersion}
          onVanillaVersionChange={(v) => setVanillaVersion("target", v)}
        />
      </div>

      {/* schematic */}
      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.schematicSection")} />
        <SchematicFilePicker
          schematic={schematic}
          labels={{ dropHere: t("setup.dropHere"), loaded: t("setup.loaded") }}
          disabled={!engineReady}
          onPick={onPickSchematic}
        />
      </div>

      {/* Only pre-flattening documents carry numeric ids, so this step exists
          only for them — a modern file needs no world to be named. */}
      {schematic?.legacy && (
        <div className="flex flex-col gap-2.5">
          <GroupHead title={t("setup.world")} />
          <WorldIdPicker
            worldIds={worldIds}
            unknownIdCount={schematic.unknownIdCount ?? 0}
            disabled={!engineReady}
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

      <Button variant="pri" icon="play" className="w-full justify-center mt-0.5" disabled={!canAnalyze} onClick={onAnalyze}>
        {isAnalyzing ? t("diff.analyzing") : analyzed ? t("setup.analyzed") : t("setup.analyzeCompat")}
      </Button>

      {errorText && (
        <Banner tone="error" className="text-[12.5px]">
          {errorText}
        </Banner>
      )}

      <ManualEnvDialog
        open={!!pendingScan}
        jarCount={pendingScan?.files.filter((f) => f.name.toLowerCase().endsWith(".jar")).length ?? 0}
        onConfirm={onRetryPendingScan}
        onCancel={onCancelPendingScan}
      />
    </div>
  );
}
