"use client";

import { useTranslations } from "next-intl";
import { Button, Banner, Disclosure, Icon } from "@/components/boffmedia/primitives";
import type { GameId } from "../../_lib/adapters";
import { useToolStore } from "../../_store/tool.store";
import { EnvPicker } from "./EnvPicker";
import { FilePicker } from "./FilePicker";

interface SetupPanelProps {
  engineReady: boolean;
  onScanSource: (gameId: GameId, files: File[]) => void;
  onScanTarget: (gameId: GameId, files: File[]) => void;
  onChangeSourceGame: (gameId: GameId) => void;
  onChangeTargetGame: (gameId: GameId) => void;
  onPickSchematic: (file: File) => void;
  onAnalyze: () => void;
}

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
  onPickSchematic,
  onAnalyze,
}: SetupPanelProps) {
  const {
    sourceGame,
    targetGame,
    sourceReg,
    targetReg,
    schematic,
    sourceScan,
    targetScan,
    isLoadingSource,
    isLoadingTarget,
    isAnalyzing,
    diff,
    error,
  } = useToolStore();
  const t = useTranslations("games.minecraft.schematicCompat");

  const guideSteps = [t("guide.step1"), t("guide.step2"), t("guide.step3"), t("guide.step4"), t("guide.step5")];

  const analyzed = !!diff;
  const canAnalyze = engineReady && !!schematic && !!sourceReg && !!targetReg && !isAnalyzing && !analyzed;

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
          game={sourceGame}
          onGameChange={onChangeSourceGame}
          registry={sourceReg}
          scan={sourceScan}
          loading={isLoadingSource}
          disabled={!engineReady}
          onPick={(files) => onScanSource(sourceGame, files)}
        />
        <div className="flex items-center justify-center gap-2 text-txt-dim py-px px-1">
          <span className="flex-1 h-px bg-line" />
          <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} />
          <span className="flex-1 h-px bg-line" />
        </div>
        <EnvPicker
          role="target"
          roleLabel={t("setup.target")}
          game={targetGame}
          onGameChange={onChangeTargetGame}
          registry={targetReg}
          scan={targetScan}
          loading={isLoadingTarget}
          disabled={!engineReady}
          onPick={(files) => onScanTarget(targetGame, files)}
        />
      </div>

      {/* schematic */}
      <div className="flex flex-col gap-2.5">
        <GroupHead title={t("setup.schematicSection")} />
        <FilePicker schematic={schematic} disabled={!engineReady} onPick={onPickSchematic} />
      </div>

      <Button variant="pri" icon="play" className="w-full justify-center mt-0.5" disabled={!canAnalyze} onClick={onAnalyze}>
        {isAnalyzing ? t("diff.analyzing") : analyzed ? t("setup.analyzed") : t("setup.analyzeCompat")}
      </Button>

      {error && (
        <Banner tone="error" className="text-[12.5px]">
          {error}
        </Banner>
      )}
    </div>
  );
}
