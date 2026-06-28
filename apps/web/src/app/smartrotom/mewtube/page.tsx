"use client";
import YoutubeResults from "./_components/YoutubeResults";
import { useBoffSession } from "@/services/useBoffSession";

export default function Youtube() {
  const { session } = useBoffSession();
  
  return (
    <div className="min-h-full bg-layer-1 overflow-auto">
      <YoutubeResults />
    </div>
  );
}