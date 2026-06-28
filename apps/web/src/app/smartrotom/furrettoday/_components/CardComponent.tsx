import React from "react";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { InternalLink } from "@/components/ui/navigation/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";
import Image from "next/image";

interface CardComponentProps {
  variant: "blue" | "purple" | "green" | "red" | "yellow" | "pink" | "default";
  news: NewsItem;
}

const variantStyles = {
  blue: {
    cardClass: "bg-secondary text-white",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-yellow-300",
    titleBgColor: "bg-yellow-300",
    titleTextColor: "text-secondary-active",
  },
  purple: {
    cardClass: "bg-secondary text-white",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-warning-soft",
    titleBgColor: "bg-warning-soft",
    titleTextColor: "text-secondary-active",
  },
  green: {
    cardClass: "bg-warning text-white",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-pink-300",
    titleBgColor: "bg-pink-300",
    titleTextColor: "text-warning",
  },
  red: {
    cardClass: "bg-red-500 text-white",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-secondary-soft",
    titleBgColor: "bg-secondary-soft",
    titleTextColor: "text-red-600",
  },
  yellow: {
    cardClass: "bg-yellow-500 text-black",
    buttonClass: "btn-pop-secondary",
    accentColor: "bg-pink-500",
    titleBgColor: "bg-secondary-soft",
    titleTextColor: "text-yellow-600",
  },
  pink: {
    cardClass: "bg-pink-500 text-white",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-secondary-soft",
    titleBgColor: "bg-yellow-300",
    titleTextColor: "text-pink-600",
  },
  default: {
    cardClass: "bg-white text-black",
    buttonClass: "btn-pop-primary",
    accentColor: "bg-black",
    titleBgColor: "bg-secondary-soft",
    titleTextColor: "text-black",
  },
};

const CardComponent: React.FC<CardComponentProps> = ({ variant, news }) => {
  const { cardClass, buttonClass, accentColor, titleBgColor, titleTextColor } = variantStyles[variant];

  if (!news)
    return (
      <Card className={`card-pop ${cardClass}`}>
        <CardContent className="p-8">
          <h3 className="text-pop-2xl font-bold mb-6 pop-shadow text-white">¡VACÍO!</h3>
          <p className="text-pop-lg mb-6 font-comic leading-relaxed">
            Furret está buscando más noticias para llenar este espacio...
          </p>
          <div className="w-24 h-24 mx-auto mb-4 bg-yellow-300 rounded-full border-3 border-black flex items-center justify-center">
            <span className="text-pop-2xl">🔍</span>
          </div>
        </CardContent>
      </Card>
    );
    
  // Extract image URL if it exists in content
  const hasImage = news.imageUrl && news.imageUrl !== "";
    
  return (
    <Card className={`card-pop ${cardClass} relative`}>
      <CardContent className="p-6 relative">
        {/* Top accent bar */}
        <div className={`h-2 ${accentColor} absolute top-0 left-8 right-8 rounded-b-lg`}></div>
        
        {/* Title with improved readability */}
        <div className="relative mb-6 transform -rotate-1">
          <h3 className={`text-pop-lg font-bold pop-shadow inline-block px-4 py-2 ${titleBgColor} ${titleTextColor} border-3 border-black rounded-lg`}>
            {news.title}
          </h3>
        </div>
        
        {/* Show image if available */}
        {hasImage && (
          <div className="relative h-32 mb-6 border-3 border-black rounded-lg overflow-hidden transform rotate-1 card-pop bg-white">
            <Image 
              src={news.imageUrl} 
              alt={`Imagen de ${news.title}`}
              layout="fill"
              objectFit="cover" 
              className="hover:scale-105 transition-transform duration-240ms"
            />
            {/* Comic style starburst accent */}
            <div className="absolute -top-2 -right-2 w-8 h-8" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path d="M12,2 L13.5,9.5 L21,12 L13.5,14.5 L12,22 L10.5,14.5 L3,12 L10.5,9.5 Z" 
                      fill="#FFD700" stroke="#000" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
        
        <div className="text-pop-base font-comic mb-6 relative leading-relaxed">
          <div className="relative z-10">
            {getPreview(news, 100)}
          </div>
        </div>
        
        <div className="relative">
          <InternalLink
            href={`furrettoday/leer/${news.id}`}
            className={`${buttonClass} pop-focus animate-button-press inline-block`}
          >
            {news.buttonText || "Leer más"}
          </InternalLink>
          
          {/* Simplified action lines */}
          <svg className="absolute -right-2 bottom-0 opacity-60" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="24" y1="24" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="24" x2="9" y2="15" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardComponent;