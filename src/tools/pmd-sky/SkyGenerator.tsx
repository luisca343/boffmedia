"use client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { getFloors, getValidDungeons } from "./DungeonData";
import { getValidPokemon } from "./PokemonData";
import { useFormStore } from "./store";
import { generateWonderMail } from "./Generate";
import { Combobox } from "@/components/ui/combobox";
import { getItemData } from "./ItemData";

import useTranslation from "next-translate/useTranslation";
import {
  getClientIsTarget,
  getForceClient,
  getQuestData,
  getRewardTypes,
  getSubQuestData,
  getUseTargetItem,
  givesItem,
} from "./QuestData";

export function SkyGenerator() {
  const [wonderMail, setWonderMail] = useState("");
  const { t: dungeonsTrans } = useTranslation("tools/pmdsky/dungeons");
  const { t: commonTrans } = useTranslation("tools/pmdsky/common");

  const { formData, targetAvailable, setFormData, setTargetAvailable } =
    useFormStore();

  const handleTargetItemChange = useCallback(
    (value: string) => {
      setFormData({ targetItem: Number(value) });
    },
    [setFormData]
  );

  const handleRewardItemChange = useCallback(
    (value: string) => {
      setFormData({ rewardItem: Number(value) });
    },
    [setFormData]
  );

  function getWonderMail() {
    const mail = generateWonderMail(formData) || "";
    setWonderMail(mail);
  }

  function updateEuropeanVersion(value: string | boolean) {
    setFormData({ europeanVersion: value === true });
    setWonderMail("");
  }

  return (
    <div className="min-h-screen text-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600">
          Sky Generator
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label={commonTrans("QUEST_TYPE")}>
            <Combobox variant="orange"  
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getQuestData(commonTrans)}
              value={formData.questType.toString()}
              onChange={(value) =>
                setFormData({
                  questType: Number(value),
                  forceClient: getForceClient(
                    Number(value),
                    formData.specialQuestType
                  ),
                  forceTarget: getForceClient(
                    Number(value),
                    formData.specialQuestType
                  ),
                })
              }
            />
          </FormField>

          <FormField label={commonTrans("QUEST_SUBTYPE")}>
            <Combobox variant="orange" 
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getSubQuestData(formData.questType, commonTrans)}
              value={formData.specialQuestType.toString()}
              disabled={
                getForceClient(
                  formData.questType,
                  formData.specialQuestType
                ) === 0
              }
              onChange={(value) =>
                setFormData({
                  specialQuestType: Number(value),
                  forceClient: getForceClient(
                    formData.questType,
                    Number(value)
                  ),
                  forceTarget: getForceClient(
                    formData.questType,
                    Number(value)
                  ),
                })
              }
            />
          </FormField>

          <FormField label={commonTrans("DUNGEON")}>
            <Combobox variant="orange"  
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getValidDungeons(dungeonsTrans)}
              value={formData.dungeon.toString()}
              onChange={(value) => setFormData({ dungeon: Number(value) })}
            />
          </FormField>

          <FormField label="Floor">
            <Input
              type="number"
              min={1}
              max={getFloors(formData.dungeon)}
              className="w-full xl:w-24 bg-gray-800 border-orange-600 text-orange-100"
              value={formData.floor}
              onChange={(e) => setFormData({ floor: Number(e.target.value) })}
            />
          </FormField>

          <FormField label={commonTrans("CLIENT_POKEMON")}>
            <div className="flex items-center">
              <Combobox variant="orange" 
                data={getValidPokemon()}
                value={formData.clientPokemon.toString()}
                onChange={(value) =>
                  setFormData({ clientPokemon: Number(value) })
                }
                disabled={
                  getForceClient(
                    formData.questType,
                    formData.specialQuestType
                  ) > 0
                }
                className="flex-grow bg-gray-800 border-orange-600 text-orange-100"
              />
              <img
                width={40}
                height={40}
                src={formData.clientSprite}
                alt="Client Sprite"
                className="ml-2"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </FormField>

          <FormField label={commonTrans("TARGET_POKEMON")}>
            <div className="flex items-center">
              <Combobox variant="orange" 
                data={getValidPokemon()}
                value={formData.targetPokemon.toString()}
                onChange={(value) =>
                  setFormData({ targetPokemon: Number(value) })
                }
                disabled={
                  getForceClient(
                    formData.questType,
                    formData.specialQuestType
                  ) > 0 || getClientIsTarget(formData.questType)
                }
                className="flex-grow bg-gray-800 border-orange-600 text-orange-100"
              />
              <img
                width={40}
                height={40}
                src={formData.targetSprite}
                alt="Target Sprite"
                className="ml-2"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </FormField>

          <FormField label={commonTrans("REWARD_TYPE")} className="md:col-span-2">
            <Combobox variant="orange" 
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getRewardTypes(commonTrans)}
              value={formData.rewardType.toString()}
              onChange={(value) => setFormData({ rewardType: Number(value) })}
            />
          </FormField>

          <FormField label={commonTrans("TARGET_ITEM")}>
            <Combobox variant="orange" 
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getItemData()}
              value={formData.targetItem.toString()}
              onChange={handleTargetItemChange}
              disabled={!getUseTargetItem(formData.questType)}
            />
          </FormField>

          <FormField label={commonTrans("REWARD_ITEM")}>
            <Combobox variant="orange" 
              className="w-full bg-gray-800 border-orange-600 text-orange-100"
              data={getItemData()}
              value={formData.rewardItem.toString()}
              onChange={handleRewardItemChange}
              disabled={!givesItem(formData.rewardType)}
            />
          </FormField>

          <FormField label={commonTrans("EUROPEAN")} className="md:col-span-2 mx-auto flex justify-center items-center space-x-2">
            <Checkbox
              className="border-orange-600"
              checked={formData.europeanVersion}
              onCheckedChange={(value) =>
                updateEuropeanVersion(value)
              }
            />
          </FormField>
        </div>

        <Button 
          onClick={getWonderMail} 
          className="w-full mb-4 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {commonTrans("GENERATE_WONDER_MAIL")}
        </Button>

        {wonderMail && (
          <div className="bg-gray-800 p-4 rounded-lg text-center border border-orange-600">
            <h2 className="text-2xl font-semibold mb-2 text-orange-400">
              Correo Secreto {formData.europeanVersion ? "(EU)" : ""}
            </h2>
            <div className="text-xl break-all text-orange-100">
              {wonderMail.split("\n").map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-lg font-medium mb-1 text-orange-300">{label}</label>
      {children}
    </div>
  );
}