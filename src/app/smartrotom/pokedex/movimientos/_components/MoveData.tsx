"use client"
import { useEffect, useState } from "react";
import TypeBadge from "../../entrada/[[...params]]/_components/TypeBadge";
import { MoveData, MoveEffect } from "./MoveEffect";
import { rotomGET } from "@/services/boffAPI";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

export default function MoveDataElement({id} : {id: string}){
    const movesTrans  = useTranslations("");
    const [move, setMove] = useState() as [MoveData, any]

    useEffect(() => {
        rotomGET(`/pokemon/move/${id}`)
            .then((res) => {
                setMove(res)
            })
    }, [id])

    if(!move) return <div>Loading...</div>
    return(
        <div>
        <div className="text-center mb-4">
                    <span className="text-3xl font-bold">{movesTrans(`attack_${move.attackName.toLowerCase().replaceAll(" ","_")}`)}</span>
                    </div>
                    <div className="flex justify-center space-x-4 mb-4">
                        <TypeBadge type={move.attackType.toLowerCase()} />
                        <TypeBadge type={move.attackCategory.toLowerCase()} />
                    </div>
                    <div className="text-center space-y-2 mb-4">
                    {/*<span className="block">{movesTrans(`attack_${move.attackName.toLowerCase().replaceAll(" ","_")}_description`)}</span>*/}
                        <div className="flex justify-center">
                            {move.basePower > 0 &&<span className="block px-2">Poder Base: {move.basePower}</span>}
                            {move.accuracy > 0 && <span className="block px-2">Precisión: {move.accuracy}</span>}
                        </div>
                        <span className="block">PP: {move.ppBase} ({move.ppMax})</span>
                        <span className="block">{move.makesContact}</span>
                    </div>
                    <div className="flex flex-col text-center space-y-2 my-4 text-xs">
                        {move.effects.map((effect) => (
                            <MoveEffect key={effect.effectTypeID + effect.type} effect={effect} />
                        ))}
                    </div>
                    <MoveTargets targetInfo={move.targetingInfo} />
        </div>
    )

    function Cell({ children, isActive, hitsAll }: { children: React.ReactNode, isActive: boolean, hitsAll?: boolean }) {
        const bgColor = isActive && hitsAll ? "bg-red-500" : isActive ? "bg-primary-300" : "bg-main-600";
        const textColor = isActive ? "text-black" : "text-main-100";
        const borderColor = isActive && hitsAll ? "border-red-500" : isActive ? "border-primary-300" : "border-main-600";
    
        return (
            <div className={`border ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-center col-span-1 row-span-1`}>
                {children}
            </div>
        );
    }
    
    function MoveTargets({ targetInfo }: { targetInfo: { hitsAll: boolean, hitsOppositeFoe: boolean, hitsAdjacentFoe: boolean, hitsExtendedFoe: boolean, hitsSelf: boolean, hitsAdjacentAlly: boolean, hitsExtendedAlly: boolean } }) {
        return (
            <div className="text-center">
                <div className="flex  mb-4 justify-center">
                    <HoverCard>
                        <HoverCardTrigger>
                            <InformationCircleIcon className="w-5 h-5 mr-1" />
                        </HoverCardTrigger>
                        <HoverCardContent className="bg-main-800 text-main-50 w-72">
                            <div className="flex items-center mb-2">
                                <div className="w-4 h-4 bg-main-600 border border-main-600 mr-2"></div>
                                <span>No alcanza al objetivo</span>
                            </div>
                            <div className="flex items-center mb-2">
                                <div className="w-4 h-4 bg-primary-300 border border-primary-300 mr-2"></div>
                                <span>Alcanza al objetivo</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 border border-red-500 mr-2"></div>
                                <span>Alcanza a todos los objetivos</span>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                    <span>Alcance</span>
                </div>
                <div className="grid grid-cols-3 grid-rows-2 gap-2 min-h-20 min-w-1/2 max-w-[1000px] m-auto">
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