"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DkApp, DkBar, DkBody, DkTitle, DkDivider, DkSeg, DkSelect, DkSpacer, DkChip } from "@/components/boffmedia/ui/tools/datakit";
import { VgcService, ChampionsRegulation, SpeedTierEntry } from "@/services/api/boffmedia/vgcService";
import { SpeedTiersTab } from "../_components/SpeedTiersTab";
import { SpeedMatchupTab } from "../_components/SpeedMatchupTab";

type Tab = "tiers" | "matchup";

function cleanRegName(name: string): string {
  return name.replace(/\[Gen 9 Champions\]\s*/i, "");
}

function SpeedPageContent() {
  const t = useTranslations("vgc.speed");
  const tTiers = useTranslations("vgc.speedTiers");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = (searchParams.get("tab") as Tab | null) ?? "tiers";

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);
  const [selectedReg, setSelectedReg] = useState("vgc2026regma");
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cross-tab prefill: entry selected in Tiers tab → sent to Matchup tab
  const [prefillEntry, setPrefillEntry] = useState<SpeedTierEntry | null>(null);

  useEffect(() => {
    VgcService.getChampionsRegulations()
      .then((res) => {
        const regs = res.data ?? [];
        setRegulations(regs);
        if (regs.length > 0 && !regs.find((r) => r.id === selectedReg)) {
          setSelectedReg(regs[0].id);
        }
      })
      .catch(() => {});
    // selectedReg intentionally excluded — only run on mount

  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    VgcService.getChampionsSpeedTiers(selectedReg)
      .then((res) => setSpeedTiers(res.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selectedReg]);

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "tiers") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSelectForMatchup = (entry: SpeedTierEntry) => {
    setPrefillEntry(entry);
    setTab("matchup");
  };

  const regList: ChampionsRegulation[] =
    regulations.length > 0
      ? regulations
      : (["vgc2026regma", "vgc2026regmabo3", "bssregma"].map((id) => ({ id, name: id })) as ChampionsRegulation[]);

  return (
    <DkApp className="min-w-0">
      <DkBar>
        <DkTitle icon="bolt" label={t("title")} sub={t("subtitle")} />
        <DkDivider />
        <DkSeg
          value={tab}
          ariaLabel={t("subtitle")}
          onChange={setTab}
          options={[
            { value: "tiers", label: t("tabs.tiers") },
            { value: "matchup", label: t("tabs.matchup") },
          ]}
        />
        <DkSelect
          value={selectedReg}
          ariaLabel={t("title")}
          minWidth="160px"
          onChange={setSelectedReg}
          options={regList.map((r) => ({ value: r.id, label: cleanRegName(r.name) }))}
        />
        <DkSpacer />
        {!loading && !error && (
          <DkChip icon="bolt">{tTiers("pokemonCount", { count: speedTiers.length })}</DkChip>
        )}
      </DkBar>

      <DkBody>
        {tab === "tiers" ? (
          <SpeedTiersTab speedTiers={speedTiers} loading={loading} error={error} onSelectForMatchup={handleSelectForMatchup} />
        ) : (
          <SpeedMatchupTab speedTiers={speedTiers} loading={loading} prefillEntry={prefillEntry} onPrefillConsumed={() => setPrefillEntry(null)} />
        )}
      </DkBody>
    </DkApp>
  );
}

export function SpeedTiersView() {
  return (
    <Suspense>
      <SpeedPageContent />
    </Suspense>
  );
}
