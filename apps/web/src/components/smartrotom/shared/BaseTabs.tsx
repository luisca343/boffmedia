"use client";

import React from "react";
import { getTheme } from "../themes";

interface Tab {
  label: string;
  value: string;
}

interface BaseTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  platform: "youtube" | "twitch";
}

export const BaseTabs = ({ tabs, activeTab, onTabChange, platform }: BaseTabsProps) => {
  const getActiveStyles = () => {
    return platform === "youtube" ? "bg-red-500 text-white" : "bg-purple-500 text-white";
  };
  
  const getInactiveStyles = () => {
    return platform === "youtube" 
      ? "bg-layer-3 text-red-400 hover:bg-red-600" 
      : "bg-layer-3 text-purple-400 hover:bg-purple-600";
  };
  
  return (
    <div className="flex space-x-2 p-2 bg-layer-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
            activeTab === tab.value ? getActiveStyles() : getInactiveStyles()
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
