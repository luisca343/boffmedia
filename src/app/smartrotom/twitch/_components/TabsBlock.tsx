"use client";

import React from "react";

interface Tab {
  label: string;
  value: string;
}

interface TabsBlockProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const TabsBlock = ({ tabs, activeTab, onTabChange }: TabsBlockProps) => {
  return (
    <div className="flex space-x-2 p-2 bg-surface-900 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
            activeTab === tab.value
              ? "bg-purple-600 text-white"
              : "bg-surface-700 text-purple-300 hover:bg-purple-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
