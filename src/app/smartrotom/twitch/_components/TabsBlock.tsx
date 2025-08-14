"use client";

import React from "react";
import { BaseTabs } from "@/components/smartrotom/shared/BaseTabs";

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
    <BaseTabs 
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      platform="twitch"
    />
  );
};
