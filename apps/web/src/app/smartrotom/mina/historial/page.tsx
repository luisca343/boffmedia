"use client";
import "../mina.css";
import Image from "next/image";
import MenuWrapper from "../_components/MenuWrapper";
import { useGetHistory } from "@/hooks/mina/useGetHistory";
import { useBoffSession } from "@/services/useBoffSession";

export default function History() {
  const { session } = useBoffSession();
  const { history } = useGetHistory(session?.user?.smartRotomUser?.uuid!);

  return (
    <MenuWrapper className="w-full min-h-full  bg-surface-900 text-white flex flex-col items-center">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl m-4">
        <h2 className="text-2xl font-bold mb-4">HISTORIAL</h2>
        <div className="space-y-4 overflow-auto">
          {Object.values(history || {})
            .reverse()
            .map((game: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-surface-600 pb-2"
              >
                <span>{new Date(game[0].date).toLocaleString()}</span>
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
