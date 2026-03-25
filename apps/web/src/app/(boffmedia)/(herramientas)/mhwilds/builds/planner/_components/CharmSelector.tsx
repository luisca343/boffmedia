import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { 
  ChevronLeft, 
  Loader2,
  X,
  Medal
} from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { BuildData, Charm, Filters } from "../../../../../../../types/tools/mhwilds";
import { CurrentEquipment } from "./CurrentEquipment";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

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

  // Apply filters whenever filters or charms changes
  useEffect(() => {
    if (isLoading || error) return;
    
    let result = [...charms];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(charm => 
        charm.name.toLowerCase().includes(searchLower) ||
        (charm.description && charm.description.toLowerCase().includes(searchLower)) ||
        charm.skills.some(skill => skill.skill.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply rarity filter
    if (filters.rarity.length > 0) {
      result = result.filter(charm => filters.rarity.includes(charm.rarity));
    }
    
    setFilteredCharms(result);
  }, [charms, filters, isLoading, error]);

  // Sort charms by rarity as default
  const sortedCharms = [...filteredCharms].sort((a, b) => a.rarity - b.rarity);

  const selectCharm = (charm: Charm) => {
    setCurrentBuild({
      ...currentBuild,
      charm
    });
    onClose();
  };

  const removeCharm = () => {
    setCurrentBuild({
      ...currentBuild,
      charm: null
    });
    onClose();
  };
  
  // Render charm item
  const CharmItem = ({ charm }: { charm: Charm }) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        variant="ghost"
        className="w-full justify-start bg-surface-700/50 hover:bg-surface-700 p-3 h-auto"
        onClick={() => selectCharm(charm)}
      >
        <div className="flex items-center w-full">
          <div className="w-14 h-14 bg-surface-600 rounded flex items-center justify-center mr-3 relative">
            <Medal className="h-8 w-8 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-surface-100 truncate pr-2">{charm.name}</p>
              <span className="text-xs text-amber-400">★{charm.rarity}</span>
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
      </Button>
    </motion.div>
  );

  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Medal className="mr-2 h-5 w-5 text-amber-400" />
            {t("build_planner.select_charm")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> {t("build_planner.close")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current equipment */}
        {currentBuild.charm && (
          <CurrentEquipment 
            equipment={currentBuild.charm} 
            slotType="charm" 
            onRemove={removeCharm} 
          />
        )}

        {/* Search field */}
        <div className="mb-4">
          <Input
            placeholder={`${t("build_planner.search")}...`}
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="bg-surface-700 border-surface-600"
          />
        </div>

        {/* Charms list */}
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center bg-surface-800/50 rounded-md">
            <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
            <span className="ml-2 text-surface-300">{t("build_planner.loading", {item: t("build_planner.charms").toLowerCase()})}</span>
          </div>
        ) : error ? (
          <div className="h-[400px] flex flex-col items-center justify-center bg-surface-800/50 rounded-md">
            <div className="text-red-400 mb-2">{error}</div>
            <Button 
              variant="outline" 
              onClick={() => {
                setError(null);
              }}
            >
              {t("build_planner.retry")}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border border-surface-700 p-2">
            <div className="grid grid-cols-1 gap-2">
              {sortedCharms.length > 0 ? (
                sortedCharms.map((charm) => (
                  <CharmItem key={charm.id} charm={charm} />
                ))
              ) : (
                <div className="text-center p-8 text-surface-400">
                  <p>{t("build_planner.no_charms_found")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}