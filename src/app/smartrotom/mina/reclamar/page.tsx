"use client";

import MenuWrapper from "../_components/MenuWrapper";
import { rotomPOST } from "@/services/boffAPI";
import Image from "next/image";
import { toast } from "react-toastify";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { UnclaimedRewards, useGetUnclaimed } from "@/hooks/mina/useGetUnclaimed";

export default function Reclamar() {
  const { session, unclaimed, setUnclaimed, getBoxes, loading } = useGetUnclaimed();

  async function claimReward() {
    if (!session) return;
    if (!isMinecraft()) {
      toast.error("No estas en Minecraft");
      return;
    }

    try {
      const response = await rotomPOST("/claim-rewards", {
        rewards: unclaimed,
      });
      if (response.success) {
        toast.success("Recompensas reclamadas con éxito");
        setUnclaimed([]);
      } else {
        toast.error("Error al reclamar recompensas");
      }
    } catch (error) {
      toast.error("Error al reclamar recompensas");
    }
  }

  function groupRewardsByType(rewards: UnclaimedRewards[]) {
    return rewards.reduce((acc, reward) => {
      if (!acc[reward.type]) {
        acc[reward.type] = [];
      }
      acc[reward.type].push(reward);
      return acc;
    }, {} as Record<string, UnclaimedRewards[]>);
  }

  if(loading) return null;
  const groupedRewards = groupRewardsByType(unclaimed!);

  return (
    <MenuWrapper className="w-full min-h-full overflow-hidden bg-surface-900 text-white  pt-4  flex flex-col items-center  text-shadow-border2">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl">
        <div className="space-y-4 overflow-auto">
          {Object.keys(groupedRewards).map((type) => (
            <div key={type}>
              <h3 className="text-2xl  mb-2">{type}</h3>
              <div className="flex space-x-2">
                {groupedRewards[type].map((reward, index) => (
                  <div key={index} className="relative group flex space-x-2">
                    <Image
                      key={index}
                      alt={reward.itemId}
                      width={32}
                      height={32}
                      src={`/smartrotom/img/apps/mina/recompensas/${
                        reward.itemId?.split(":")[1]
                      }.png`}
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="ml-2">x{reward.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <SmartRotomButton
            onClick={claimReward}
            className=" text-white text-xl  text-shadow-border1"
          >
            RECLAMAR TODO ({getBoxes()} CAJAS)
          </SmartRotomButton>
        </div>
      </div>
    </MenuWrapper>
  );
}
