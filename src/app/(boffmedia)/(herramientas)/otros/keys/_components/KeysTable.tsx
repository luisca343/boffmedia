"use client";

import { useState, Suspense, lazy } from "react";
import useGetKeys from "../_hooks/useGetKeys";
import useFetchSteamData from "../_hooks/useFetchSteamData";
import { KeysHeader } from "./KeysHeader";
import { KeysControls } from "./KeysControls";
import { KeysDataTable } from "./KeysDataTable";
import { FloatingSection } from "@/app/(boffmedia)/_components/layout/FloatingSection";

const SteamDialog = lazy(() => import("./SteamDialog"));

export default function KeysTable() {
  const { filteredKeys, filter, setFilter } = useGetKeys();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showClaimed, setShowClaimed] = useState<boolean>(false);
  const { selectedGame, isModalVisible, setIsModalVisible, fetchGameData } = useFetchSteamData();

  if (!filteredKeys) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        <p className="text-surface-300">Cargando claves...</p>
      </div>
    </div>
  );

  const displayedKeys = showClaimed
    ? filteredKeys
    : filteredKeys.filter((key) => key.claimed !== "s");

  const aggregatedKeys = displayedKeys.reduce((acc: { [key: string]: any }, key) => {
    const keyIdentifier = `${key.name}-${key.claimed}`;
    if (!acc[keyIdentifier]) {
      acc[keyIdentifier] = { ...key, count: 1 };
    } else {
      acc[keyIdentifier].count += 1;
    }
    return acc;
  }, {});

  const aggregatedKeysArray = Object.values(aggregatedKeys);

  return (
    <FloatingSection className={`flex-1 bg-surface-900 overflow-hidden w-full transition-all duration-300 ease-in-out md:pt-0 pt-16 h-screen`}>
      <div className="w-full  h-screen overflow-auto pb-16">
        <div className="max-w-5xl mx-auto">
          <KeysHeader />
          
          <KeysControls 
            filter={filter}
            setFilter={setFilter}
            showClaimed={showClaimed}
            setShowClaimed={setShowClaimed}
            availableCount={filteredKeys.filter(k => k.claimed !== "s").length}
            claimedCount={filteredKeys.filter(k => k.claimed === "s").length}
            totalCount={filteredKeys.length}
          />

          <KeysDataTable 
            keys={aggregatedKeysArray}
            hoveredRow={hoveredRow}
            setHoveredRow={setHoveredRow}
            fetchGameData={fetchGameData}
          />
        </div>

        <Suspense fallback={<div className="fixed inset-0 bg-surface-900/70 flex items-center justify-center">Cargando...</div>}>
          <SteamDialog
            isModalVisible={isModalVisible}
            setIsModalVisible={setIsModalVisible}
            selectedGame={selectedGame}
          />
        </Suspense>
      </div>
    </FloatingSection>
  );
}