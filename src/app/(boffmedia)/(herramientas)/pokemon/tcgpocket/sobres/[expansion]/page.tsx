"use client";
import { PtcgpService } from "@/services/api/boffmedia/oldptcgpService";
import { useEffect, useState } from "react";
import { CardsList } from "../../_components/CardsList";
import { TcgCard } from "@/generated/api";

export default function Expansions({
  params,
}: {
  params: { expansion: string };
}) {
  const { expansion } = params;
  const [cards, setCards] = useState<TcgCard[]>([]);

  useEffect(() => {
    PtcgpService.getCards(expansion).then((response) => {
      setCards(response.data || []);
    });
  }, [expansion]);

  return <CardsList cards={cards} />;
}