"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { getFloors, getValidDungeons } from "./DungeonData";
import { useFormStore } from "./store";
import { Combobox } from "@/components/ui/combobox";
import { getItemData } from "./ItemData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  HiSparkles, 
  HiMail, 
  HiLocationMarker, 
  HiViewBoards, 
  HiUsers, 
  HiGift, 
  HiLightningBolt,
  HiClipboardCopy,
  HiCheckCircle,
  HiInformationCircle,
  HiCursorClick
} from "react-icons/hi";
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
import { useState } from "react";

export function SkyGenerator() {
  const t = useTranslations("");
  const { formData, setFormData } = useFormStore();
  const { wonderMail, generateMail, clearMail } = useWonderMail();
  const [copied, setCopied] = useState(false);

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

  const handleCopy = useCallback(async () => {
    if (wonderMail) {
      await navigator.clipboard.writeText(wonderMail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [wonderMail]);

  const isClientForced = getForceClient(formData.questType, formData.specialQuestType) > 0;
  const isTargetDisabled = isClientForced || getClientIsTarget(formData.questType);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="min-h-full text-surface-50 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div variants={itemVariants}>
          <Header />
        </motion.div>

        {/* Main Form Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl">
            
            {/* Quest Configuration Section */}
            <div className="mb-8">
              <SectionHeader icon={<HiCursorClick className="w-5 h-5" />} title={t("QUEST_CONFIGURATION")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField 
                  label={t("QUEST_TYPE")} 
                  icon={<HiViewBoards className="w-4 h-4 text-blue-400" />}
                  required
                >
                  <Combobox 
                    variant="orange"
                    className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors"
                    data={getQuestData(t)}
                    value={formData.questType.toString()}
                    onChange={handleQuestTypeChange}
                  />
                </FormField>

                <FormField 
                  label={t("QUEST_SUBTYPE")} 
                  icon={<HiSparkles className="w-4 h-4 text-purple-400" />}
                  disabled={!isClientForced}
                >
                  <Combobox 
                    variant="orange"
                    className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
                    data={getSubQuestData(formData.questType, t)}
                    value={formData.specialQuestType.toString()}
                    disabled={!isClientForced}
                    onChange={handleSubQuestChange}
                  />
                </FormField>
              </div>
            </div>

            {/* Location Section */}
            <div className="mb-8">
              <SectionHeader icon={<HiLocationMarker className="w-5 h-5" />} title={t("LOCATION_SETTINGS")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField 
                  label={t("DUNGEON")} 
                  icon={<HiLocationMarker className="w-4 h-4 text-green-400" />}
                  required
                >
                  <Combobox 
                    variant="orange"
                    className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors"
                    data={getValidDungeons(t)}
                    value={formData.dungeon.toString()}
                    onChange={(value) => setFormData({ dungeon: Number(value) })}
                  />
                </FormField>

                <FormField 
                  label={t("FLOOR")} 
                  icon={<HiViewBoards className="w-4 h-4 text-orange-400" />}
                  required
                >
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={getFloors(formData.dungeon)}
                      className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors pr-16"
                      value={formData.floor}
                      onChange={(e) => setFormData({ floor: Number(e.target.value) })}
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface-600/50 text-surface-300 text-xs"
                    >
                      Max: {getFloors(formData.dungeon)}
                    </Badge>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Pokemon Section */}
            <div className="mb-8">
              <SectionHeader icon={<HiUsers className="w-5 h-5" />} title={t("POKEMON_SETTINGS")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField 
                  label={t("CLIENT_POKEMON")} 
                  icon={<HiUsers className="w-4 h-4 text-cyan-400" />}
                  disabled={isClientForced}
                >
                  <PokemonSelector
                    value={formData.clientPokemon.toString()}
                    onChange={(value) => setFormData({ clientPokemon: Number(value) })}
                    disabled={isClientForced}
                    sprite={formData.clientSprite}
                    alt="Client Sprite"
                  />
                  {isClientForced && (
                    <p className="text-xs text-surface-400 mt-1 flex items-center">
                      <HiInformationCircle className="w-3 h-3 mr-1" />
                      {t("FORCED_BY_QUEST_TYPE")}
                    </p>
                  )}
                </FormField>

                <FormField 
                  label={t("TARGET_POKEMON")} 
                  icon={<HiCursorClick className="w-4 h-4 text-red-400" />}
                  disabled={isTargetDisabled}
                >
                  <PokemonSelector
                    value={formData.targetPokemon.toString()}
                    onChange={(value) => setFormData({ targetPokemon: Number(value) })}
                    disabled={isTargetDisabled}
                    sprite={formData.targetSprite}
                    alt="Target Sprite"
                  />
                  {isTargetDisabled && (
                    <p className="text-xs text-surface-400 mt-1 flex items-center">
                      <HiInformationCircle className="w-3 h-3 mr-1" />
                      {getClientIsTarget(formData.questType) ? t("CLIENT_IS_TARGET") : t("FORCED_BY_QUEST_TYPE")}
                    </p>
                  )}
                </FormField>
              </div>
            </div>

            {/* Rewards Section */}
            <div className="mb-8">
              <SectionHeader icon={<HiGift className="w-5 h-5" />} title={t("REWARD_SETTINGS")} />
              <div className="space-y-6">
                <FormField 
                  label={t("REWARD_TYPE")} 
                  icon={<HiGift className="w-4 h-4 text-yellow-400" />}
                  required
                >
                  <Combobox 
                    variant="orange"
                    className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors"
                    data={getRewardTypes(t)}
                    value={formData.rewardType.toString()}
                    onChange={(value) => setFormData({ rewardType: Number(value) })}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField 
                    label={t("TARGET_ITEM")} 
                    icon={<HiCursorClick className="w-4 h-4 text-indigo-400" />}
                    disabled={!getUseTargetItem(formData.questType)}
                  >
                    <Combobox 
                      variant="orange"
                      className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
                      data={getItemData()}
                      value={formData.targetItem.toString()}
                      onChange={handleItemChange('targetItem')}
                      disabled={!getUseTargetItem(formData.questType)}
                    />
                  </FormField>

                  <FormField 
                    label={t("REWARD_ITEM")} 
                    icon={<HiGift className="w-4 h-4 text-pink-400" />}
                    disabled={!givesItem(formData.rewardType)}
                  >
                    <Combobox 
                      variant="orange"
                      className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
                      data={getItemData()}
                      value={formData.rewardItem.toString()}
                      onChange={handleItemChange('rewardItem')}
                      disabled={!givesItem(formData.rewardType)}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mb-8">
              <SectionHeader icon={<HiLightningBolt className="w-5 h-5" />} title={t("ADDITIONAL_SETTINGS")} />
              
              <EuropeanVersionToggle 
                checked={formData.europeanVersion}
                onChange={handleEuropeanVersionChange}
              />
            </div>

            {/* Generate Button */}
            <GenerateButton onClick={handleGenerateWonderMail} />
          </Card>
        </motion.div>

        {/* Wonder Mail Result */}
        {wonderMail && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <WonderMailDisplay 
              mail={wonderMail} 
              isEuropean={formData.europeanVersion}
              onCopy={handleCopy}
              copied={copied}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function Header() {
  const t = useTranslations("");
  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 drop-shadow-lg">
          ✨ {t("WONDER_MAIL_CREATOR")} ✨
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
        <p className="text-surface-300 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          {t("WONDER_MAIL_CREATOR_DESCRIPTION")}
        </p>
      </motion.div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-700/50">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-500/30">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-surface-100">{title}</h3>
    </div>
  );
}

function GenerateButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("");
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        onClick={onClick}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg py-6"
      >
        <HiMail className="w-5 h-5 mr-2" />
        {t("GENERATE_WONDER_MAIL")}
        <HiSparkles className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );
}

function WonderMailDisplay({ mail, isEuropean, onCopy, copied }: { 
  mail: string; 
  isEuropean: boolean; 
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <Card className="p-6 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <HiMail className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Wonder Mail {isEuropean ? "(EU)" : "(US/JP)"}
          </h2>
          <HiMail className="w-6 h-6 text-blue-400" />
        </div>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          {isEuropean ? "European Version" : "US/Japanese Version"}
        </Badge>
      </div>
      
      <div className="relative bg-surface-900/50 p-6 rounded-xl border border-surface-600/30">
        <div className="text-center font-mono text-lg leading-relaxed text-surface-50 select-all">
          {mail.split("\n").map((line, index) => (
            <div key={index} className="py-1">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
        
        <motion.button
          onClick={onCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 border border-surface-600/30 transition-colors"
        >
          {copied ? (
            <HiCheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <HiClipboardCopy className="w-5 h-5 text-surface-300" />
          )}
        </motion.button>
      </div>
      
      <p className="text-center text-surface-400 text-sm mt-4 flex items-center justify-center gap-2">
        <HiInformationCircle className="w-4 h-4" />
        Click the copy button above to copy the Wonder Mail to your clipboard
      </p>
    </Card>
  );
}

function FormField({ 
  label, 
  children, 
  className, 
  icon, 
  required, 
  disabled 
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <label className={`block text-base font-medium mb-3 transition-colors ${
        disabled ? 'text-surface-500' : 'text-surface-200'
      }`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
          {disabled && <Badge variant="outline" className="text-xs">Disabled</Badge>}
        </div>
      </label>
      {children}
    </div>
  );
}

function EuropeanVersionToggle({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations("");

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-surface-700/40 to-surface-800/40 border border-surface-600/30 hover:border-primary-500/40 transition-all duration-300">
        
        {/* Left side with flag and text */}
        <div className="flex items-center gap-4">
          <motion.div 
            className="text-2xl"
            animate={{ rotate: checked ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            🇪🇺
          </motion.div>
          <div>
            <span className="text-lg font-medium text-surface-100 group-hover:text-primary-300 transition-colors">
              {t("EUROPEAN_VERSION")}
            </span>
            <div className="text-sm text-surface-400">
              {checked ? 'Formato EU activado' : 'Formato internacional'}
            </div>
          </div>
        </div>

        {/* Right side with toggle */}
        <motion.div
          className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${
            checked 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
              : 'bg-surface-600'
          }`}
          animate={{
            boxShadow: checked 
              ? '0 0 20px rgba(59, 130, 246, 0.3)' 
              : '0 0 0px rgba(0, 0, 0, 0)'
          }}
        >
          <motion.div
            className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-xs"
            animate={{
              x: checked ? 32 : 0,
              rotate: checked ? 360 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {checked ? '✓' : '○'}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}