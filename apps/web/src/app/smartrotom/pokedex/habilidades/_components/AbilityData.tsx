"use client"
import { useTranslations } from "next-intl";
import { useGetAbility } from "@/hooks/pokemon/useGetAbility";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function AbilityDataElement({id, isFullPage = false} : {id: string, isFullPage?: boolean}){
    const t = useTranslations("pokedex");
    const { ability } = useGetAbility(id);

    if (!ability) return (
        <div className="flex justify-center items-center p-2">
            <div className="text-surface-100 text-base animate-pulse">Cargando...</div>
        </div>
    );

    const abilityName = t(`ability_${ability.name.replace(/\s+/g, "")}`);
    const abilityDescription = t(`ability_${ability.name.replace(/\s+/g, "")}_description`);

    return (
        <div className="space-y-4">
            {!isFullPage && (
                <div className="text-center mb-3">
                    <h2 className="text-xl font-bold text-surface-50">
                        {abilityName}
                    </h2>
                </div>
            )}
            
            <div className="flex items-start gap-3">
                <div className="mt-1">
                    <SparklesIcon className="h-5 w-5 text-primary-300" />
                </div>
                <div>
                    <h3 className="text-base font-medium text-primary-200 mb-2">Efecto</h3>
                    <p className="text-surface-100">
                        {abilityDescription}
                    </p>
                </div>
            </div>
            
            {isFullPage && ability.isHidden !== undefined && (
                <div className="flex items-center mt-2 pt-3 border-t border-surface-600/30">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                        ability.isHidden 
                            ? "bg-primary-900/30 text-primary-300 border border-primary-700/50" 
                            : "bg-surface-600/30 text-surface-200 border border-surface-500/50"
                    }`}>
                        {ability.isHidden ? "Habilidad oculta" : "Habilidad estándar"}
                    </span>
                </div>
            )}
        </div>
    );
}