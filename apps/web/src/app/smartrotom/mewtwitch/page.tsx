"use client";
import TwitchResults from "./_components/TwitchResults";
import { useBoffSession } from "@/services/useBoffSession";

export default function Twitch() {
  const { session } = useBoffSession();
  
  return (
    <div className="min-h-full bg-layer-1 overflow-auto">
      <TwitchResults />
    </div>
  );
}
