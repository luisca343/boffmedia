"use client";
import { HistoryView } from "./_components/History";

export default function HistoryPage() {
  return (
    <div className="min-h-full bg-layer-1 overflow-auto text-white">
      <HistoryView />
    </div>
  );
}