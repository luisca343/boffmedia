import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";

interface CardComponentProps {
  variant: "blue" | "purple" | "green" | "red" | "yellow" | "pink" | "default";
  news: NewsItem;
}

const variantStyles = {
  blue: {
    cardClass: "bg-blue-500 text-white",
    buttonClass: "bg-yellow-300 text-blue-500 hover:bg-white",
  },
  purple: {
    cardClass: "bg-purple-500 text-white",
    buttonClass: "bg-yellow-300 text-purple-500 hover:bg-white",
  },
  green: {
    cardClass: "bg-green-500 text-white",
    buttonClass: "bg-yellow-300 text-green-500 hover:bg-white",
  },
  red: {
    cardClass: "bg-red-500 text-white",
    buttonClass: "bg-yellow-300 text-red-500 hover:bg-white",
  },
  yellow: {
    cardClass: "bg-yellow-500 text-black",
    buttonClass: "bg-blue-500 text-yellow-500 hover:bg-white",
  },
  pink: {
    cardClass: "bg-pink-500 text-white",
    buttonClass: "bg-yellow-300 text-pink-500 hover:bg-white",
  },
  default: {
    cardClass: "bg-white text-black",
    buttonClass: "bg-main-300 text-black hover:bg-main-400",
  },
};

const CardComponent: React.FC<CardComponentProps> = ({ variant, news }) => {
  const { cardClass, buttonClass } = variantStyles[variant];

  if (!news)
    return (
      <Card
        className={`overflow-hidden transform hover:scale-105 transition-transform border-8 border-black ${cardClass}`}
      >
        <CardContent className="p-6">
          <h3 className="text-4xl font-bold mb-4 pop-shadow text-white">¡VACÍO!</h3>
          <p className="text-2xl mb-4 font-comic leading-relaxed">
            Furret está buscando más noticias para llenar este espacio...
          </p>
          <div className="w-24 h-24 mx-auto mb-4 bg-yellow-300 rounded-full border-4 border-black flex items-center justify-center">
            <span className="text-5xl">🔍</span>
          </div>
        </CardContent>
      </Card>
    );
  return (
    <Card
      className={`overflow-hidden transform hover:scale-105 transition-transform border-8 border-black ${cardClass}`}
    >
      <CardContent className="p-6">
        <h3 className="text-4xl font-bold mb-2 pop-shadow text-white">
          {news.title}
        </h3>
        <p className="text-xl font-comic">
          {getPreview(news, 100)}
        </p>
        <InternalLink
          href={`/noticias/leer/${news.id}`}
          className={`inline-block mt-4 font-bold py-2 px-4 rounded-full transform hover:scale-110 transition-transform button-pop-shadow ${buttonClass}`}
        >
          {news.buttonText || "Leer más"}
        </InternalLink>
      </CardContent>
    </Card>
  );
};

export default CardComponent;