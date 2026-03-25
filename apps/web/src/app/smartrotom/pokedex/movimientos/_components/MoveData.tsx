"use client"
import TypeBadge from "../../entrada/[[...params]]/_components/TypeBadge";
import { MoveEffect } from "./MoveEffect";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useGetMove } from "@/hooks/pokemon/useGetMove";
import { getTranslatedMoveName } from "@/utils/pokemonTranslations";

export default function MoveDataElement({id, isFullPage = false} : {id: string, isFullPage?: boolean}){
    const t = useTranslations("pokedex");
    const { move } = useGetMove(id);

    if(!move) return (
        <div className="flex justify-center items-center p-2">
            <div className="text-surface-100 text-base animate-pulse">Cargando...</div>
        </div>
    );

    return(
        <div className={`space-y-4 ${isFullPage ? "" : "text-center"}`}>
            {!isFullPage && (
                <div className="text-center">
                    <h2 className="text-xl font-bold text-surface-50">
                        {getTranslatedMoveName(move.attackName, t)}
                    </h2>
                </div>
            )}
            
            <div className={`flex justify-center space-x-4`}>
                <TypeBadge type={move.attackType.toLowerCase()} />
                <TypeBadge type={move.attackCategory.toLowerCase()} />
            </div>
            
            <div className={`grid grid-cols-2 gap-3 bg-surface-800/50 rounded-lg p-4 border border-surface-700/30 ${isFullPage ? "" : "max-w-[50vw] mx-auto"}`}>
                {move.basePower > 0 && (
                    <>
                        <div className="text-surface-200 font-medium">Poder Base</div>
                        <div className="text-surface-100 text-right">{move.basePower}</div>
                    </>
                )}
                {move.accuracy > 0 && (
                    <>
                        <div className="text-surface-200 font-medium">Precisión</div>
                        <div className="text-surface-100 text-right">{move.accuracy}</div>
                    </>
                )}
                <div className="text-surface-200 font-medium">PP</div>
                <div className="text-surface-100 text-right">{move.ppBase} ({move.ppMax})</div>
                <div className="text-surface-200 font-medium">Contacto</div>
                <div className="text-surface-100 text-right">{move.makesContact ? "Sí" : "No"}</div>
                
                {isFullPage && (
                    <>
                        <div className="text-surface-200 font-medium">Nombre Original</div>
                        <div className="text-surface-100 text-right">{move.attackName}</div>
                    </>
                )}
            </div>
            
            {move.effects.length > 0 && (
                <div>
                    <div className={`text-lg font-semibold text-surface-200 mb-2 ${isFullPage ? "" : "text-center"}`}>Efectos</div>
                    <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                        <div className={`flex flex-col ${!isFullPage && "text-center"} space-y-2 text-surface-100`}>
                            {move.effects.map((effect) => (
                                <MoveEffect key={effect.effectTypeID + effect.type} effect={effect} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div>
                <div className={`text-lg font-semibold text-surface-200 mb-2 ${isFullPage ? "" : "text-center"}`}>Alcance</div>
                <MoveTargets targetInfo={move.targetingInfo} />
            </div>

            {isFullPage && move.z && move.z.length > 0 && (
                <div>
                    <div className="text-lg font-semibold text-surface-200 mb-2">Información Z</div>
                    <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-surface-200 font-medium">Cristal Z</div>
                            <div className="text-surface-100 text-right">{move.z[0].crystal || "—"}</div>
                            
                            <div className="text-surface-200 font-medium">Nombre Z</div>
                            <div className="text-surface-100 text-right">{move.z[0].attackName || "—"}</div>
                            
                            <div className="text-surface-200 font-medium">Poder Z</div>
                            <div className="text-surface-100 text-right">{move.z[0].basePower || "—"}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    function Cell({ children, isActive, hitsAll }: { children: React.ReactNode, isActive: boolean, hitsAll?: boolean }) {
        const bgColor = isActive && hitsAll ? "bg-red-500" : isActive ? "bg-primary-300" : "bg-surface-600";
        const textColor = isActive ? "text-black" : "text-surface-100";
        const borderColor = isActive && hitsAll ? "border-red-500" : isActive ? "border-primary-300" : "border-surface-600";
    
        return (
            <div className={`border ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-center col-span-1 row-span-1 p-1 text-xs`}>
                {children}
            </div>
        );
    }
    
    function MoveTargets({ targetInfo }: { targetInfo: { hitsAll: boolean, hitsOppositeFoe: boolean, hitsAdjacentFoe: boolean, hitsExtendedFoe: boolean, hitsSelf: boolean, hitsAdjacentAlly: boolean, hitsExtendedAlly: boolean } }) {
        return (
            <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                <div className="flex justify-center items-center mb-3">
                    <HoverCard>
                        <HoverCardTrigger>
                            <div className="flex items-center">
                                <InformationCircleIcon className="w-4 h-4 mr-1 text-surface-300" />
                                <span className="text-surface-200 text-sm">Información de alcance</span>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="bg-surface-800 text-surface-50 w-64 border-surface-950 border z-50 p-2 text-sm">
                            <div className="flex items-center mb-1">
                                <div className="w-3 h-3 bg-surface-600 border border-surface-600 mr-2"></div>
                                <span>No alcanza al objetivo</span>
                            </div>
                            <div className="flex items-center mb-1">
                                <div className="w-3 h-3 bg-primary-300 border border-primary-300 mr-2"></div>
                                <span>Alcanza al objetivo</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 border border-red-500 mr-2"></div>
                                <span>Alcanza a todos los objetivos</span>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
                <div className="grid grid-cols-3 grid-rows-2 gap-1 h-14 max-w-[300px] m-auto">
                    <Cell isActive={targetInfo.hitsOppositeFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
                    <Cell isActive={targetInfo.hitsAdjacentFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
                    <Cell isActive={targetInfo.hitsExtendedFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
                    <Cell isActive={targetInfo.hitsSelf} hitsAll={targetInfo.hitsAll}>Usuario</Cell>
                    <Cell isActive={targetInfo.hitsAdjacentAlly} hitsAll={targetInfo.hitsAll}>Aliado</Cell>
                    <Cell isActive={targetInfo.hitsExtendedAlly} hitsAll={targetInfo.hitsAll}>Aliado</Cell>
                </div>
            </div>
        );
    }
}