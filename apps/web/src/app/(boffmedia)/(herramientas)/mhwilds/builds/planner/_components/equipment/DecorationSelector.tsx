import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { X, ChevronLeft, Gem, Check, Loader2 } from "lucide-react";
import {
  BuildData,
  EquipmentType,
  Decoration,
  Filters
} from "@/types/tools/mhwilds";
import { useTranslations } from "next-intl";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle } from "../MHWildsPanel";

interface DecorationSelectorProps {
  equipmentType: EquipmentType;
  slotIndex: number;
  slotSize: number;
  currentBuild: BuildData;
  setCurrentBuild: (build: BuildData) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
  decorations: Decoration[];
}

// ─── Slot color ───────────────────────────────────────────────────────────────

const SLOT_COLORS: Record<number, { bg: string; text: string }> = {
  4: { bg: "rgba(168,85,247,0.8)",  text: "rgb(233,213,255)" },
  3: { bg: "rgba(34,211,238,0.8)",  text: "rgb(207,250,254)" },
  2: { bg: "rgba(250,204,21,0.8)",  text: "rgb(254,240,138)" },
  1: { bg: "rgba(100,116,139,0.7)", text: "rgb(226,232,240)" },
}

function getSlotStyle(size: number) {
  return SLOT_COLORS[size] ?? SLOT_COLORS[1];
}

export function DecorationSelector({
  decorations,
  equipmentType,
  slotIndex,
  slotSize,
  currentBuild,
  setCurrentBuild,
  filters,
  setFilters,
  onClose
}: DecorationSelectorProps) {
  const t = useTranslations("mhwilds");
  const [error, setError] = useState<string | null>(null);
  const [filteredDecorations, setFilteredDecorations] = useState<Decoration[]>([]);

  const currentDecoration = currentBuild.decorations?.find(
    d => d.equipmentType === equipmentType && d.slotIndex === slotIndex
  )?.decoration;

  useEffect(() => {
    if (filters.rarity.length > 0) {
      setFilters(prev => ({ ...prev, rarity: [] }));
    }
  }, []);

  useEffect(() => {
    if (!decorations) return;
    let filtered = [...decorations].filter(deco => deco.slot <= slotSize);
    filtered = filtered.filter(deco => {
      if (!deco.kind) return true;
      if (deco.kind === 'weapon') return equipmentType === 'weapon';
      if (deco.kind === 'armor')  return equipmentType !== 'weapon';
      return true;
    });
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(deco =>
        deco.name.toLowerCase().includes(searchLower) ||
        (deco.description && deco.description.toLowerCase().includes(searchLower)) ||
        deco.skills.some(skill => skill.skill.name.toLowerCase().includes(searchLower))
      );
    }
    if (filters.rarity && filters.rarity.length > 0) {
      filtered = filtered.filter(deco => filters.rarity.includes(deco.rarity));
    }
    filtered.sort((a, b) => a.slot !== b.slot ? b.slot - a.slot : b.rarity - a.rarity);
    setFilteredDecorations(filtered);
  }, [decorations, filters, slotSize, equipmentType]);

  const assignDecoration = (decoration: Decoration | null) => {
    let updatedDecorations = [...(currentBuild.decorations || [])];
    updatedDecorations = updatedDecorations.filter(
      d => !(d.equipmentType === equipmentType && d.slotIndex === slotIndex)
    );
    if (decoration) {
      updatedDecorations.push({ equipmentType, slotIndex, slotSize, decoration });
    }
    setCurrentBuild({ ...currentBuild, decorations: updatedDecorations });
    onClose();
  };

  const slotStyle = getSlotStyle(slotSize);

  return (
    <MHWildsPanel>
      <MHWildsPanelHeader>
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-highlight-400" />
          <MHWildsPanelTitle>{t("build_planner.select_decoration")}</MHWildsPanelTitle>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: slotStyle.bg, color: slotStyle.text }}
          >
            {slotSize}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-surface-400 hover:text-surface-200" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </MHWildsPanelHeader>

      <div className="p-4">
        {/* Search */}
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder={t("build_planner.search")}
              className="bg-surface-900/60 border-surface-700/60 pl-8 placeholder:text-surface-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <div className="absolute left-2.5 top-2.5 text-surface-500">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
            </div>
          </div>
        </div>

        {/* Slot info */}
        <div
          className="p-3 rounded-lg mb-4"
          style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.2)" }}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1">
            {t("build_planner.assigned_to")}
          </div>
          <div className="flex items-center text-surface-100 text-sm">
            <span className="font-medium">{t(equipmentType)}</span>
            <span className="mx-2 text-surface-500">•</span>
            <span>{t("slot")} {slotIndex + 1}</span>
            <span className="mx-2 text-surface-500">•</span>
            <span className="flex items-center gap-1">
              {t("build_planner.slot_size")}
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ml-0.5"
                style={{ background: slotStyle.bg, color: slotStyle.text }}
              >
                {slotSize}
              </div>
            </span>
          </div>
        </div>

        {/* Decoration list */}
        <ScrollArea className="h-[350px]">
          {!decorations ? (
            <div className="h-full flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
              <span className="text-surface-400 text-sm">
                {t("build_planner.loading", { item: t("build_planner.decorations") })}
              </span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <p className="text-sm" style={{ color: "rgba(252,165,165,0.9)" }}>{error}</p>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => window.location.reload()}>
                {t("build_planner.retry")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {/* Remove current decoration */}
              {currentDecoration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pb-2 mb-2"
                  style={{ borderBottom: "1px solid rgba(71,85,105,0.3)" }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between bg-red-900/20 hover:bg-red-900/30 text-red-300 p-3 h-auto"
                    onClick={() => assignDecoration(null)}
                  >
                    <span>{t("build_planner.remove")} {currentDecoration.name}</span>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {filteredDecorations.length > 0 ? (
                filteredDecorations.map((decoration) => {
                  const dSlotStyle = getSlotStyle(decoration.slot);
                  const isActive = currentDecoration?.id === decoration.id;
                  return (
                    <motion.div key={decoration.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <button
                        className="w-full text-left p-3 rounded-lg transition-all duration-200"
                        style={isActive
                          ? { background: "rgba(132,204,22,0.07)", border: "1px solid rgba(132,204,22,0.3)" }
                          : { background: "rgba(30,41,59,0.4)", border: "1px solid transparent" }}
                        onMouseEnter={e => !isActive && (e.currentTarget.style.background = "rgba(30,41,59,0.65)")}
                        onMouseLeave={e => !isActive && (e.currentTarget.style.background = "rgba(30,41,59,0.4)")}
                        onClick={() => assignDecoration(decoration)}
                      >
                        <div className="flex items-center w-full">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-lg font-bold"
                            style={{ background: dSlotStyle.bg, color: dSlotStyle.text }}
                          >
                            {decoration.slot}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between w-full">
                              <span className="font-medium text-surface-100">{decoration.name}</span>
                              {isActive && <Check className="h-4 w-4 text-highlight-400" />}
                            </div>
                            <div className="flex flex-wrap text-xs text-highlight-400 mt-1">
                              {decoration.skills.map((skillInfo, idx) => (
                                <span key={`${decoration.id}-skill-${idx}`} className="mr-3">
                                  {skillInfo.skill.name} +{skillInfo.level}
                                </span>
                              ))}
                            </div>
                            {decoration.description && (
                              <p className="text-xs text-surface-400 mt-1 italic">{decoration.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center p-8 text-surface-400">
                  <p>{t("build_planner.no_decorations_found")}</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 flex justify-between"
        style={{ borderTop: "1px solid rgba(71,85,105,0.2)" }}
      >
        <Button variant="ghost" size="sm" className="text-surface-400 hover:text-surface-200" onClick={onClose}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("build_planner.back")}
        </Button>
      </div>
    </MHWildsPanel>
  );
}
