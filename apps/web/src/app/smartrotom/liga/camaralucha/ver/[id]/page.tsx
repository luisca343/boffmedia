"use client"
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LigaService } from "@/services/api/smartrotom/ligaService";

/**
 * Loaded on demand (audit S11).
 *
 * MEASURED: statically importing `Game` put the battle engine and the full
 * `@pkmn` dex — a 7.4 MB chunk plus a 1.8 MB one — into this route's initial
 * client bundle, making it ~11.8 MB against a ~1.15 MB median across the 125
 * SmartRotom routes. It and /smartrotom/pasaporte were the only two routes in
 * that range, and both for this same import.
 *
 * Unlike the passport, this page IS the player, so deferring does not avoid the
 * download — it stops the download from BLOCKING first paint. The page already
 * renders a loading state while it fetches the replay; the chunk now downloads
 * during that fetch instead of before the page renders at all.
 */
const Game = dynamic(
  () => import("@boffmedia/tools-battlesim").then((m) => m.Game),
  { ssr: false },
);

export default function VerPage({ params }: { params: { id: string } }) {
  const t = useTranslations("liga.replay");
  const [replay, setReplay] = useState(null);

  // Warm the player chunk alongside the fetch rather than after it. Without
  // this the two are serialized — `Game` only mounts once `replay` is set, so
  // the 9 MB download would not even START until the API call came back.
  useEffect(() => {
    void import("@boffmedia/tools-battlesim");
  }, []);

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