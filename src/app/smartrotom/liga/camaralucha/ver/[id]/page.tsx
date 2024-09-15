"use client"
import { useEffect, useState } from "react";
import { Game } from "@/app/battlesim/replay/_components/Game";
import { rotomGET } from "@/services/boffAPI";

export default function VerPage({ params }: { params: { id: string } }) {
  const [replay, setReplay] = useState(null);

  useEffect(() => {
    async function fetchReplay() {
      const replayData = await rotomGET(`/liga/replay/${params.id}`);
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