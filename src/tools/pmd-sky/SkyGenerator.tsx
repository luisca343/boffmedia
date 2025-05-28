"use client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { getFloors, getValidDungeons } from "./DungeonData";
import { useFormStore } from "./store";
import { Combobox } from "@/components/ui/combobox";
import { getItemData } from "./ItemData";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  getClientIsTarget,
  getForceClient,
  getQuestData,
  getRewardTypes,
  getSubQuestData,
  getUseTargetItem,
  givesItem,
} from "./QuestData";
import { useWonderMail } from "./_hooks/useWonderMail";
import { PokemonSelector } from "./_components/PokemonSelector";

export function SkyGenerator() {
  const t = useTranslations("");
  const { formData, setFormData } = useFormStore();
  const { wonderMail, generateMail, clearMail } = useWonderMail();

  const handleItemChange = useCallback(
    (field: 'targetItem' | 'rewardItem') => (value: string) => {
      setFormData({ [field]: Number(value) });
    },
    [setFormData]
  );

  const handleQuestTypeChange = useCallback((value: string) => {
    const questType = Number(value);
    setFormData({
      questType,
      forceClient: getForceClient(questType, formData.specialQuestType),
      forceTarget: getForceClient(questType, formData.specialQuestType),
    });
  }, [setFormData, formData.specialQuestType]);

  const handleSubQuestChange = useCallback((value: string) => {
    const specialQuestType = Number(value);
    setFormData({
      specialQuestType,
      forceClient: getForceClient(formData.questType, specialQuestType),
      forceTarget: getForceClient(formData.questType, specialQuestType),
    });
  }, [setFormData, formData.questType]);

  const handleEuropeanVersionChange = useCallback((value: string | boolean) => {
    setFormData({ europeanVersion: value === true });
    clearMail();
  }, [setFormData, clearMail]);

  const handleGenerateWonderMail = useCallback(() => {
    generateMail(formData);
  }, [generateMail, formData]);

  const isClientForced = getForceClient(formData.questType, formData.specialQuestType) > 0;
  const isTargetDisabled = isClientForced || getClientIsTarget(formData.questType);

  return (
    <div className="min-h-full text-surface-50 p-6">
      <Card className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700">
        <Header />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label={t("QUEST_TYPE")}>
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getQuestData(t)}
              value={formData.questType.toString()}
              onChange={handleQuestTypeChange}
            />
          </FormField>

          <FormField label={t("QUEST_SUBTYPE")}>
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getSubQuestData(formData.questType, t)}
              value={formData.specialQuestType.toString()}
              disabled={!isClientForced}
              onChange={handleSubQuestChange}
            />
          </FormField>

          <FormField label={t("DUNGEON")}>
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getValidDungeons(t)}
              value={formData.dungeon.toString()}
              onChange={(value) => setFormData({ dungeon: Number(value) })}
            />
          </FormField>

          <FormField label={t("FLOOR")}>
            <Input
              type="number"
              min={1}
              max={getFloors(formData.dungeon)}
              className="w-full xl:w-24 bg-surface-700 border-surface-600 text-surface-50"
              value={formData.floor}
              onChange={(e) => setFormData({ floor: Number(e.target.value) })}
            />
          </FormField>

          <FormField label={t("CLIENT_POKEMON")}>
            <PokemonSelector
              value={formData.clientPokemon.toString()}
              onChange={(value) => setFormData({ clientPokemon: Number(value) })}
              disabled={isClientForced}
              sprite={formData.clientSprite}
              alt="Client Sprite"
            />
          </FormField>

          <FormField label={t("TARGET_POKEMON")}>
            <PokemonSelector
              value={formData.targetPokemon.toString()}
              onChange={(value) => setFormData({ targetPokemon: Number(value) })}
              disabled={isTargetDisabled}
              sprite={formData.targetSprite}
              alt="Target Sprite"
            />
          </FormField>

          <FormField label={t("REWARD_TYPE")} className="md:col-span-2">
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getRewardTypes(t)}
              value={formData.rewardType.toString()}
              onChange={(value) => setFormData({ rewardType: Number(value) })}
            />
          </FormField>

          <FormField label={t("TARGET_ITEM")}>
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getItemData()}
              value={formData.targetItem.toString()}
              onChange={handleItemChange('targetItem')}
              disabled={!getUseTargetItem(formData.questType)}
            />
          </FormField>

          <FormField label={t("REWARD_ITEM")}>
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700 border-surface-600 text-surface-50"
              data={getItemData()}
              value={formData.rewardItem.toString()}
              onChange={handleItemChange('rewardItem')}
              disabled={!givesItem(formData.rewardType)}
            />
          </FormField>

          <FormField 
            label={t("EUROPEAN")} 
            className="md:col-span-2 mx-auto flex justify-center items-center space-x-2"
          >
            <Checkbox
              className="border-surface-600"
              checked={formData.europeanVersion}
              onCheckedChange={handleEuropeanVersionChange}
            />
          </FormField>
        </div>

        <GenerateButton onClick={handleGenerateWonderMail} />
        
        {wonderMail && <WonderMailDisplay mail={wonderMail} isEuropean={formData.europeanVersion} />}
      </Card>
    </div>
  );
}

function Header() {
  const t = useTranslations("");
  return (
    <div className="text-center mb-8 relative">
      <span className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400 drop-shadow-lg">
        ✨ {t("WONDER_MAIL_CREATOR")} ✨
      </span>
      <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-orange-400 mx-auto rounded-full mb-2"></div>
      <p className="text-surface-300 text-lg font-medium">{t("WONDER_MAIL_CREATOR_DESCRIPTION")}</p>
    </div>
  );
}

function GenerateButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("");
  
  return (
    <Button 
      onClick={onClick}
      className="w-full mb-4 bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {t("GENERATE_WONDER_MAIL")}
    </Button>
  );
}

function WonderMailDisplay({ mail, isEuropean }: { mail: string; isEuropean: boolean }) {
  return (
    <div className="bg-surface-700 p-4 rounded-lg text-center border border-surface-600 shadow-lg">
      <h2 className="text-2xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">
        Correo Secreto {isEuropean ? "(EU)" : ""}
      </h2>
      <div className="text-xl break-all text-surface-50">
        {mail.split("\n").map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, children, className }: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-lg font-medium mb-1 text-surface-200">{label}</label>
      {children}
    </div>
  );
}