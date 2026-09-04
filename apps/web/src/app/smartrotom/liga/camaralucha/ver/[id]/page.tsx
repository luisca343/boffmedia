"use client"
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Game } from "@boffmedia/tools-battlesim";
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

  // `--tool-vh`: the player is a viewport-true frame (see `BattleShell`), and
  // this page is not a tool host, so it has to say how tall its box is.
  return (
    <div className="flex flex-col" style={{ ["--tool-vh" as string]: "min(90dvh, 52rem)" }}>
      <Game replayData={replay} />
    </div>
  );
}