import { useTranslations } from "next-intl";
import { UserGroupIcon, UserIcon, CursorArrowRippleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { SectionHeader } from "@/components/ui/form/FormSectionHeader";
import { FormField } from "@/components/ui/form/FormField";
import { PokemonSelector } from "./PokemonSelector";
import { getClientIsTarget, getForceClient } from "../QuestData";

interface PokemonSectionProps {
  questType: number;
  specialQuestType: number;
  clientPokemon: number;
  targetPokemon: number;
  clientSprite: string;
  targetSprite: string;
  onClientPokemonChange: (value: string) => void;
  onTargetPokemonChange: (value: string) => void;
}

export function PokemonSection({
  questType,
  specialQuestType,
  clientPokemon,
  targetPokemon,
  clientSprite,
  targetSprite,
  onClientPokemonChange,
  onTargetPokemonChange
}: PokemonSectionProps) {
  const t = useTranslations("pmdsky");
  const isClientForced = getForceClient(questType, specialQuestType) > 0;
  const isTargetDisabled = isClientForced || getClientIsTarget(questType);

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<UserGroupIcon className="w-5 h-5" />} 
        title={t("POKEMON_SETTINGS")} 
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField 
          label={t("CLIENT_POKEMON")} 
          icon={<UserIcon className="w-4 h-4 text-cyan-400" />}
          disabled={isClientForced}
        >
          <PokemonSelector
            value={clientPokemon.toString()}
            onChange={onClientPokemonChange}
            disabled={isClientForced}
            sprite={clientSprite}
            alt="Client Sprite"
          />
          {isClientForced && (
            <p className="text-xs text-surface-400 mt-1 flex items-center">
              <InformationCircleIcon className="w-3 h-3 mr-1" />
              {t("FORCED_BY_QUEST_TYPE")}
            </p>
          )}
        </FormField>

        <FormField 
          label={t("TARGET_POKEMON")} 
          icon={<CursorArrowRippleIcon className="w-4 h-4 text-red-400" />}
          disabled={isTargetDisabled}
        >
          <PokemonSelector
            value={targetPokemon.toString()}
            onChange={onTargetPokemonChange}
            disabled={isTargetDisabled}
            sprite={targetSprite}
            alt="Target Sprite"
          />
          {isTargetDisabled && (
            <p className="text-xs text-surface-400 mt-1 flex items-center">
              <InformationCircleIcon className="w-3 h-3 mr-1" />
              {getClientIsTarget(questType) ? t("CLIENT_IS_TARGET") : t("FORCED_BY_QUEST_TYPE")}
            </p>
          )}
        </FormField>
      </div>
    </div>
  );
}