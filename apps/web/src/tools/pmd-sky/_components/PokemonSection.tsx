import { useTranslations } from "next-intl";
import { UserGroupIcon, UserIcon, CursorArrowRippleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { FormField } from "@/components/ui/form/FormField";
import { ToolSectionHeader } from "@components/boffmedia/tools/ToolSectionHeader";
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
  onTargetPokemonChange,
}: PokemonSectionProps) {
  const t = useTranslations("");
  const isClientForced = getForceClient(questType, specialQuestType) > 0;
  const isTargetDisabled = isClientForced || getClientIsTarget(questType);

  return (
    <div className="mb-8">
      <ToolSectionHeader
        icon={<UserGroupIcon />}
        label={t("POKEMON_SETTINGS")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          label={t("CLIENT_POKEMON")}
          icon={<UserIcon className="w-4 h-4 text-secondary-400" />}
          disabled={isClientForced}
          variant="gaming"
        >
          <PokemonSelector
            value={clientPokemon.toString()}
            onChange={onClientPokemonChange}
            disabled={isClientForced}
            sprite={clientSprite}
            alt="Client Sprite"
          />
          {isClientForced && (
            <p className="text-[10px] font-mono text-surface-500 mt-1.5 flex items-center gap-1 tracking-wide">
              <InformationCircleIcon className="w-3 h-3" />
              {t("FORCED_BY_QUEST_TYPE")}
            </p>
          )}
        </FormField>

        <FormField
          label={t("TARGET_POKEMON")}
          icon={<CursorArrowRippleIcon className="w-4 h-4 text-red-400" />}
          disabled={isTargetDisabled}
          variant="gaming"
        >
          <PokemonSelector
            value={targetPokemon.toString()}
            onChange={onTargetPokemonChange}
            disabled={isTargetDisabled}
            sprite={targetSprite}
            alt="Target Sprite"
          />
          {isTargetDisabled && (
            <p className="text-[10px] font-mono text-surface-500 mt-1.5 flex items-center gap-1 tracking-wide">
              <InformationCircleIcon className="w-3 h-3" />
              {getClientIsTarget(questType) ? t("CLIENT_IS_TARGET") : t("FORCED_BY_QUEST_TYPE")}
            </p>
          )}
        </FormField>
      </div>
    </div>
  );
}
