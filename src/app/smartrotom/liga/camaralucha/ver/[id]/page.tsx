"use client"
import { useEffect, useState } from "react";
import { Game } from "@/app/battlesim/replay/_components/Game";
import { LigaService } from "@/services/api/smartrotom/ligaService";

export default function VerPage({ params }: { params: { id: string } }) {
  const [replay, setReplay] = useState(null);

  useEffect(() => {
    async function fetchReplay() {
      const replayData = await LigaService.getReplay(Number(params.id)) as any;
      setReplay(replayData[0]);
    }

    fetchReplay();
  }, [params.id]);

  if (!replay) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Game replayData={replay} />
    </div>
  );
}