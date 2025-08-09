import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InternalLink } from "@/components/nav/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";
import Image from "next/image";

interface CardComponentProps {
  variant: "blue" | "purple" | "green" | "red" | "yellow" | "pink" | "default";
  news: NewsItem;
}

const variantStyles = {
  blue: {
    cardClass: "bg-secondary-500 text-white",
    buttonClass: "bg-yellow-300 text-secondary-500 hover:bg-white",
    accentColor: "border-yellow-300",
    titleBgColor: "bg-yellow-300",
    titleTextColor: "text-secondary-600",
  },
  purple: {
    cardClass: "bg-accent-500 text-white",
    buttonClass: "bg-yellow-300 text-accent-500 hover:bg-white",
    accentColor: "border-highlight-300",
    titleBgColor: "bg-highlight-300",
    titleTextColor: "text-accent-700",
  },
  green: {
    cardClass: "bg-highlight-500 text-white",
    buttonClass: "bg-yellow-300 text-highlight-500 hover:bg-white",
    accentColor: "border-pink-300",
    titleBgColor: "bg-pink-300",
    titleTextColor: "text-highlight-700",
  },
  red: {
    cardClass: "bg-red-500 text-white",
    buttonClass: "bg-yellow-300 text-red-500 hover:bg-white",
    accentColor: "border-secondary-300",
    titleBgColor: "bg-secondary-300",
    titleTextColor: "text-red-600",
  },
  yellow: {
    cardClass: "bg-yellow-500 text-black",
    buttonClass: "bg-secondary-500 text-yellow-500 hover:bg-white",
    accentColor: "border-pink-500",
    titleBgColor: "bg-secondary-300",
    titleTextColor: "text-yellow-600",
  },
  pink: {
    cardClass: "bg-pink-500 text-white",
    buttonClass: "bg-yellow-300 text-pink-500 hover:bg-white",
    accentColor: "border-secondary-300",
    titleBgColor: "bg-yellow-300",
    titleTextColor: "text-pink-600",
  },
  default: {
    cardClass: "bg-white text-black",
    buttonClass: "bg-surface-300 text-black hover:bg-surface-400",
    accentColor: "border-black",
    titleBgColor: "bg-secondary-300",
    titleTextColor: "text-black",
  },
};

const CardComponent: React.FC<CardComponentProps> = ({ variant, news }) => {
  const { cardClass, buttonClass, accentColor, titleBgColor, titleTextColor } = variantStyles[variant];

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
    
  // Extract image URL if it exists in content
  const hasImage = news.imageUrl && news.imageUrl !== "";
    
  return (
    <Card
      className={`overflow-hidden transform hover:scale-105 transition-transform border-8 border-black ${cardClass} relative`}
    >
      <CardContent className="p-6 relative">
        {/* Top border accent */}
        <div className={`h-2 ${accentColor} absolute top-0 left-8 right-8`}></div>
        
        {/* Title with improved contrast background */}
        <div className="relative mb-4 transform -rotate-2">
          <h3 className={`text-4xl font-bold pop-shadow inline-block px-4 py-1 ${titleBgColor} ${titleTextColor} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]`}>
            {news.title}
          </h3>
        </div>
        
        {/* Show image if available with improved styling */}
        {hasImage && (
          <div className="relative h-32 mb-4 border-4 border-black transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.7)]">
            <Image 
              src={news.imageUrl} 
              alt={news.title} 
              layout="fill"
              objectFit="cover" 
              className="mix-blend-luminosity hover:mix-blend-normal transition-all duration-300"
            />
            {/* Add comic style starburst accent in corner of image */}
            <div className="absolute -top-4 -right-4 w-10 h-10">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path d="M12,2 L13.5,9.5 L21,12 L13.5,14.5 L12,22 L10.5,14.5 L3,12 L10.5,9.5 Z" 
                      fill="yellow" stroke="black" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
        
        <div className="text-xl font-comic mb-4 relative">
          {/* Ben-Day dot pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 10 10%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%221%22 fill=%22%23fff%22 fill-opacity=%220.3%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none"></div>
          
          <div className="relative z-10">
            {getPreview(news, 100)}
          </div>
        </div>
        
        <div className="relative">
          <InternalLink
            href={`/noticias/leer/${news.id}`}
            className={`inline-block mt-2 font-bold py-2 px-4 rounded-full transform hover:scale-110 transition-transform button-pop-shadow border-4 border-black ${buttonClass}`}
          >
            {news.buttonText || "Leer más"}
          </InternalLink>
          
          {/* Enhanced comic style action lines */}
          <svg className="absolute -right-4 bottom-0" width="40" height="40" viewBox="0 0 40 40">
            <line x1="40" y1="40" x2="20" y2="20" stroke="#000" strokeWidth="2" />
            <line x1="30" y1="40" x2="15" y2="25" stroke="#000" strokeWidth="2" />
            <line x1="20" y1="40" x2="10" y2="30" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardComponent;