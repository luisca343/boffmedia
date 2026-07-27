"use client"
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Game } from "@/app/battlesim/replay/_components/Game";
import { LigaService } from "@/services/api/smartrotom/ligaService";

export default function VerPage({ params }: { params: { id: string } }) {
  const t = useTranslations("liga.replay");
  const [replay, setReplay] = useState(null);

  useEffect(() => {
    async function fetchReplay() {
      const replayData = await LigaService.getReplay(Number(params.id)) as any;
      setReplay(replayData[0]);
    }

    fetchReplay();
  }, [params.id]);

  if (!replay) {
    return <div>{t("loading")}</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Game replayData={replay} />
    </div>
  );
}