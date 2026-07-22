"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import MenuWrapper from "../_components/MenuWrapper";
import Image from "next/image";
import { toast } from "react-toastify";
import { SmartRotomButton } from "@/components/smartrotom/ui";
import { isMinecraft, mcefQuery } from "@/services/mcef/mcefHelper";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";
import { useGetUnclaimed } from "@/hooks/mina/useGetUnclaimed";
import { MinaService } from "@/services/api/smartrotom/minaService";
import { darCaja, darCajaLegacy, getMcUserData } from "@/services/mcef/mcefApi";
import { ItemImage } from "@/lib/ItemImage";
import { UnclaimedItem } from "@boffmedia/shared";

export default function Reclamar() {
  const t = useTranslations("mina");
  const uuid = useRotomUuid();
  const { unclaimed, setUnclaimed, boxes, isLoading } = useGetUnclaimed(uuid!);

  const [claiming, setClaiming] = useState(false);

  async function claimReward() {
    if (!unclaimed || claiming) return;
    if (!isMinecraft()) {
      toast.error(t("reclamar.notInMinecraft"));
      return;
    }

    setClaiming(true);
    try {
      const mc = await getMcUserData();

      const cajaResult =
        mc.data?.cajaProtocol === "source"
          ? await claimServerGranted()
          : await claimLegacy();

      if (!cajaResult) return;

      if (cajaResult.error) {
        toast.error(t("reclamar.giveBoxError"));
        return;
      }

      toast.success(t("reclamar.claimSuccess"));
      setUnclaimed([]);
    } catch {
      toast.error(t("reclamar.claimError"));
    } finally {
      setClaiming(false);
    }
  }

  /**
   * The jar asks the backend what this player is owed and grants that. The page
   * never names an item, so it does not spend anything itself either.
   */
  async function claimServerGranted() {
    const result = await darCaja("mine");
    if (result.error) return result;

    // The jar reports how many it actually granted. Zero is a success at the
    // transport level but not a claim, and reporting it as one would be the same
    // lie this whole path exists to remove — just a smaller one.
    if (!result.data?.objetos) {
      toast.info(t("reclamar.noRewards"));
      setUnclaimed([]);
      return null;
    }
    return result;
  }

  /**
   * 1.16.5: the page spends, then tells the jar what to grant. Grant strictly from
   * what the server says THIS call claimed — granting from `unclaimed` would
   * re-grant on every extra submit, because the claim succeeds even when it took
   * nothing.
   */
  async function claimLegacy() {
    const { claimedItems } = await MinaService.claimRewards({ uuid: uuid! });

    if (!claimedItems?.length) {
      toast.info(t("reclamar.noRewards"));
      setUnclaimed([]);
      return null;
    }

    const objetosMC = claimedItems.map(item => ({
      id: item.itemId,
      cantidad: item.amount ?? 1
    }));
    return await darCajaLegacy(objetosMC);
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
            disabled={claiming}
            size="lg"
            className="text-base"
          >
            {claiming ? t("reclamar.claiming") : t("reclamar.claimAll", { count: boxes })}
          </SmartRotomButton>
        </div>
      </div>
    </MenuWrapper>
  );
}
