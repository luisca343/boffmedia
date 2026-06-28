"use client";

import MenuWrapper from "../_components/MenuWrapper";
import Image from "next/image";
import { toast } from "react-toastify";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";
import { isMinecraft, mcefQuery } from "@/services/mcef/mcefHelper";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetUnclaimed } from "@/hooks/mina/useGetUnclaimed";
import { MinaService } from "@/services/api/smartrotom/minaService";
import { darCaja } from "@/services/mcef/mcefApi";
import { ItemImage } from "@/lib/ItemImage";
import { UnclaimedItem } from "@boffmedia/shared";

export default function Reclamar() {
  const { session } = useBoffSession();
  const { unclaimed, setUnclaimed, boxes, isLoading } = useGetUnclaimed(session.user.smartRotomUser?.uuid!);

  async function claimReward() {
    if (!unclaimed) return;
    if (!isMinecraft()) {
      toast.error("No estas en Minecraft");
      return;
    }

    const response = await MinaService.claimRewards({ uuid: session.user.smartRotomUser?.uuid! });
    if (response) {  
      const objetosMC = unclaimed.map(reward => ({
        id: reward.itemId,
        cantidad: reward.amount ?? 0
      }));
      const cajaResult = await darCaja(objetosMC);
      
      if (cajaResult.error) {
        toast.error("Error al dar la caja");
        return;
      }
  
      toast.success("Recompensas reclamadas correctamente");
      setUnclaimed([]);
    }
    else {
      toast.error("Error al reclamar las recompensas");
    }
  }

  function groupRewardsByType(rewards: UnclaimedItem[]) {
    return rewards.reduce((acc, reward) => {
      if (!acc[reward.type]) {
        acc[reward.type] = [];
      }
      acc[reward.type].push(reward);
      return acc;
    }, {} as Record<string, UnclaimedItem[]>);
  }

  if(!unclaimed) return null;
  const groupedRewards = groupRewardsByType(unclaimed!);

  return (
    <MenuWrapper className="w-full min-h-full overflow-hidden bg-layer-1 text-white  pt-4  flex flex-col items-center  text-shadow-border2">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl">
        <div className="space-y-4 overflow-auto">
          {Object.keys(groupedRewards).map((type) => (
            <div key={type}>
              <h3 className="text-2xl  mb-2">{type}</h3>
              <div className="flex space-x-2">
                {groupedRewards[type].map((reward, index) => (
                  <div key={index} className="relative group flex space-x-2">
                      <ItemImage 
                        key={index}
                        type="mina"
                        itemId={reward.itemId}
                        amount={reward.amount}
                      />
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
            RECLAMAR TODO ({boxes} CAJAS)
          </SmartRotomButton>
        </div>
      </div>
    </MenuWrapper>
  );
}
