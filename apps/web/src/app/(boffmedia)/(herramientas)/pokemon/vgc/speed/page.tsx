"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import {
  VgcService,
  ChampionsRegulation,
  SpeedTierEntry,
} from "@/services/api/boffmedia/vgcService";
import { SpeedTiersTab } from "./_components/SpeedTiersTab";
import { SpeedMatchupTab } from "./_components/SpeedMatchupTab";

type Tab = "tiers" | "matchup";

function SpeedPageContent() {
  const t = useTranslations("vgc.speed");
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

  const setTab = (next: Tab) => {
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
      : (["vgc2026regma", "vgc2026regmabo3", "bssregma"].map((id) => ({
          id,
          name: id,
        })) as ChampionsRegulation[]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
          <Zap className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-surface-50">{t("title")}</h1>
          <p className="text-surface-400 text-sm">{t("subtitle")}</p>
        </div>
      </motion.div>

      {/* Shared regulation selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-wrap gap-2"
      >
        {regList.map((reg) => (
          <button
            key={reg.id}
            onClick={() => setSelectedReg(reg.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              selectedReg === reg.id
                ? "bg-primary-500/20 border-primary-500/60 text-primary-300"
                : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
            }`}
          >
            {reg.name.replace(/\[Gen 9 Champions\]\s*/i, "")}
          </button>
        ))}
      </motion.div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-surface-800/50 rounded-lg p-1 w-fit border border-surface-700">
        {(["tiers", "matchup"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === tabKey
                ? "bg-primary-500/20 text-primary-300"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "tiers" ? (
        <SpeedTiersTab
          speedTiers={speedTiers}
          loading={loading}
          error={error}
          onSelectForMatchup={handleSelectForMatchup}
        />
      ) : (
        <SpeedMatchupTab
          speedTiers={speedTiers}
          loading={loading}
          prefillEntry={prefillEntry}
          onPrefillConsumed={() => setPrefillEntry(null)}
        />
      )}
    </div>
  );
}

export default function SpeedPage() {
  return (
    <Suspense>
      <SpeedPageContent />
    </Suspense>
  );
}
