import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Loader2, X, Medal } from "lucide-react";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { BuildData, Charm, Filters } from "../../../../../../../types/tools/mhwilds";
import { CurrentEquipment } from "./CurrentEquipment";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle } from "./MHWildsPanel";

interface CharmSelectorProps {
  currentBuild: BuildData;
  setCurrentBuild: (build: BuildData) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
  isLoading: boolean;
  charms: Charm[];
}

export function CharmSelector({
  currentBuild,
  setCurrentBuild,
  filters,
  setFilters,
  onClose,
  isLoading,
  charms
}: CharmSelectorProps) {
  const t = useTranslations("mhwilds");
  const [filteredCharms, setFilteredCharms] = useState<Charm[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || error) return;
    let result = [...charms];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(charm =>
        charm.name.toLowerCase().includes(searchLower) ||
        (charm.description && charm.description.toLowerCase().includes(searchLower)) ||
        charm.skills.some(skill => skill.skill.name.toLowerCase().includes(searchLower))
      );
    }
    if (filters.rarity.length > 0) {
      result = result.filter(charm => filters.rarity.includes(charm.rarity));
    }
    setFilteredCharms(result);
  }, [charms, filters, isLoading, error]);

  const sortedCharms = [...filteredCharms].sort((a, b) => a.rarity - b.rarity);

  const selectCharm = (charm: Charm) => {
    setCurrentBuild({ ...currentBuild, charm });
    onClose();
  };

  const removeCharm = () => {
    setCurrentBuild({ ...currentBuild, charm: null });
    onClose();
  };

  const CharmItem = ({ charm }: { charm: Charm }) => (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <button
        className="w-full text-left rounded-lg p-3 transition-all duration-200"
        style={{ background: "rgba(30,41,59,0.4)" }}
        onClick={() => selectCharm(charm)}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(30,41,59,0.7)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(30,41,59,0.4)")}
      >
        <div className="flex items-center w-full">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
            style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(71,85,105,0.3)" }}
          >
            <Medal className="h-8 w-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-surface-100 truncate pr-2">{charm.name}</p>
              <span className="text-xs text-amber-400 flex-shrink-0">★{charm.rarity}</span>
            </div>
            <div className="flex flex-wrap gap-x-2 text-xs">
              {charm.skills?.map((skill, idx) => (
                <span key={idx} className="text-highlight-400">
                  {skill.skill.name} +{skill.level}
                </span>
              ))}
            </div>
            {charm.description && (
              <p className="text-xs text-surface-400 mt-1 italic">{charm.description}</p>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );

  return (
    <MHWildsPanel>
      <MHWildsPanelHeader>
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-400" />
          <MHWildsPanelTitle>{t("build_planner.select_charm")}</MHWildsPanelTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-surface-400 hover:text-surface-200" onClick={onClose}>
          <X className="h-4 w-4 mr-1" /> {t("build_planner.close")}
        </Button>
      </MHWildsPanelHeader>

      <div className="p-4">
        {currentBuild.charm && (
          <CurrentEquipment equipment={currentBuild.charm} slotType="charm" onRemove={removeCharm} />
        )}

        <div className="mb-4">
          <Input
            placeholder={`${t("build_planner.search")}...`}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-surface-900/60 border-surface-700/60 placeholder:text-surface-500"
          />
        </div>

        {isLoading ? (
          <div
            className="h-[400px] flex items-center justify-center gap-2 rounded-lg"
            style={{ background: "rgba(15,23,42,0.4)" }}
          >
            <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
            <span className="text-surface-400 text-sm">
              {t("build_planner.loading", { item: t("build_planner.charms").toLowerCase() })}
            </span>
          </div>
        ) : error ? (
          <div
            className="h-[400px] flex flex-col items-center justify-center gap-3 rounded-lg"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <p className="text-sm" style={{ color: "rgba(252,165,165,0.9)" }}>{error}</p>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => setError(null)}>
              {t("build_planner.retry")}
            </Button>
          </div>
        ) : (
          <ScrollArea
            className="h-[400px] rounded-lg p-2"
            style={{ border: "1px solid rgba(71,85,105,0.3)" }}
          >
            <div className="grid grid-cols-1 gap-2">
              {sortedCharms.length > 0 ? (
                sortedCharms.map(charm => <CharmItem key={charm.id} charm={charm} />)
              ) : (
                <div className="text-center p-8 text-surface-400">
                  <p>{t("build_planner.no_charms_found")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </MHWildsPanel>
  );
}
