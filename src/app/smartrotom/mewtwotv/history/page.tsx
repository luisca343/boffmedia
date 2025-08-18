"use client";
import { HistoryView } from "./_components/History";

export default function HistoryPage() {
  return (
    <div className="min-h-full bg-surface-900 overflow-auto text-white">
      <HistoryView />
    </div>
  );
}
