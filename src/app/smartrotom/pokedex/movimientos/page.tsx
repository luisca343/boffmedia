"use client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { rotomGET } from "@/services/boffAPI";
import MoveDataElement from "./_components/MoveData";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Move {
    name: string;
    count: number;
}

export default function Movimientos() {
    const [moves, setMoves] = useState<Move[] | null>(null);
    const t  = useTranslations("");

    useEffect(() => {
        rotomGET('/pokemon/moves').then((res:any) => {
            setMoves(res.data);
        });
    }, []);

    if (!moves) return <div>loading...</div>;
    return (
        <div className="bg-surface-800 flex flex-wrap text-surface-100 w-full justify-between p-2">
            {moves.map((move: Move) => (
                <HoverCard key={move.name}>
                    <HoverCardTrigger 
                        onClick={() => window.location.href = `/smartrotom/pokedex/movimientos/${move.name}`} 
                        className="flex flex-col p-2 text-center items-center justify-center hover:text-surface-800 hover:bg-surface-400 w-64 h-32 border rounded-lg my-1"
                    >
                        <span className="text-lg font-medium">{t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)}</span>
                        <span className="text-sm">{move.count}</span>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal p-4 rounded-lg">
                        <MoveDataElement id={move.name} />
                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    );
}