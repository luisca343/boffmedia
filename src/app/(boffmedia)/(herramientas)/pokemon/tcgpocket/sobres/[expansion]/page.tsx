"use client";
import { boffGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { CardsList } from "../../_components/CardsList";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export default function Expansions({
  params,
}: {
  params: { expansion: string };
}) {
  const { expansion } = params;
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    boffGET(`/herramientas/ptcgp/cards/${expansion}`).then((data) => {
      console.log(data);
      setCards(data.data as Card[]);
    });
  }, []);

  return <CardsList cards={cards} />;
}
