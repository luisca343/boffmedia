"use client"

import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout";
import { boffGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export default function TCGPocket() {
    const [cards, setCards] = useState<Card[]>([]);

    useEffect(() => {
        boffGET("/herramientas/ptcgp/cards").then((data: Card[]) => {
            console.log(data);
            setCards(data);
        });
    }, []);

    return (      
        <BoffLayout>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-5 gap-4">
                    {cards.map((card, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img 
                                src={`/img/tcgpocket/cards/${card.expansion}/${card.number}.jpg`} 
                                alt={card.name}
                                className="w-full h-auto object-contain"
                            />
                            <h3 className="mt-2 text-center text-sm font-medium">{card.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </BoffLayout>
    )
}