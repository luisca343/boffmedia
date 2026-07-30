"use client";
import "../mina.css";
import Image from "next/image";
import MenuWrapper from "../_components/MenuWrapper";
import { useGetHistory } from "@/hooks/mina/useGetHistory";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";
import { useTranslations } from "next-intl";
import { useFormat } from "@boffmedia/ui/useFormat";

export default function History() {
  const t = useTranslations("mina");
  const fmt = useFormat();
  const uuid = useRotomUuid();
  const { history } = useGetHistory(uuid!);

  return (
    <MenuWrapper className="w-full min-h-full  bg-layer-1 text-white flex flex-col items-center">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl m-4">
        <h2 className="text-2xl font-bold mb-4">{t("history.title")}</h2>
        <div className="space-y-4 overflow-auto">
          {Object.values(history || {})
            .reverse()
            .map((game: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-edge pb-2"
              >
                <span>{fmt.dateTime(game[0].date)}</span>
                <div className="flex space-x-2">
                  {game.map((reward: any, i: number) => (
                    <Image
                      key={i}
                      alt={reward.itemId}
                      width={32}
                      height={32}
                      src={`/smartrotom/img/apps/mina/recompensas/${
                        reward.itemId?.split(":")[1]
                      }.png`}
                      style={{ imageRendering: "pixelated" }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </MenuWrapper>
  );
}
