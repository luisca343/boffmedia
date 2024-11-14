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
        rotomGET('/pokemon/moves').then((res) => {
            setMoves(res);
        });
    }, []);

    if (!moves) return <div>loading...</div>;
    return (
        <div className="bg-surface-3 flex flex-wrap text-text-primary w-full justify-between p-2">
            {moves.map((move: Move) => (
                <HoverCard key={move.name}>
                    <HoverCardTrigger 
                        onClick={() => window.location.href = `/smartrotom/pokedex/movimientos/${move.name}`} 
                        className="flex flex-col p-2 text-center items-center justify-center hover:text-text-tertiary hover:bg-foreground w-64 h-32 border rounded-lg my-1"
                    >
                        <span className="text-lg font-medium">{t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)}</span>
                        <span className="text-sm">{move.count}</span>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-surface-3 text-text-primary w-[400px] border-border-dark border font-normal p-4 rounded-lg">
                        <MoveDataElement id={move.name} />
                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    );
}