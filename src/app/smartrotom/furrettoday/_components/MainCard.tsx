import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";

interface MainCardProps {
  news: NewsItem | undefined;
}

const MainCard: React.FC<MainCardProps> = ({ news }) => {
  if (!news)
    return (
      <Card className="col-span-1 md:col-span-2 card-pop bg-yellow-300 relative">
        <div className="absolute top-4 right-4 bg-red-500 text-white py-2 px-4 font-bold text-pop-base transform rotate-12 z-10 border-3 border-black rounded-lg pop-shadow">
          ¡EXCLUSIVA!
        </div>
        <CardContent className="p-8 relative">
          <h2 className="text-pop-4xl font-bold text-red-500 pop-shadow-strong mb-6">
            ¡OOPS!
          </h2>
          <p className="text-pop-xl mb-6 font-comic leading-relaxed text-black">
            ¡Parece que Furret se ha comido la noticia principal!
          </p>
          <div className="relative w-full h-64 mb-4">
            <Image
              src="/smartrotom/img/apps/furrettoday/furret2.png"
              alt="Furret comiendo papel - Imagen de error"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </CardContent>
      </Card>
    );

  const image = news.imageUrl
    ? news.imageUrl
    : "/smartrotom/img/apps/furrettoday/default.webp";
    
  return (
    <Card className="col-span-1 md:col-span-2 card-pop bg-white relative">
      {/* News Flash Banner */}
      <div className="absolute top-4 right-4 bg-red-500 text-white py-3 px-6 font-bold text-pop-base transform rotate-12 z-10 border-3 border-black rounded-lg pop-shadow">
        ¡ÚLTIMA HORA!
      </div>
      
      <div className="relative h-96">
        <Image 
          src={image} 
          alt={`Imagen de ${news.title}`} 
          layout="fill" 
          objectFit="cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-500 mix-blend-multiply opacity-20"></div>
        
        {/* Comic style speech bubble with improved readability */}
        <div className="speech-bubble absolute top-6 left-6 bg-yellow-300 max-w-[70%] transform -rotate-1">
          <h2 className="text-pop-2xl md:text-pop-3xl font-bold text-black leading-tight">
            {news.title}
          </h2>
        </div>
      </div>
      
      <CardContent className="p-8 relative">
        <div className="flex items-center mb-6">
          <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
          {news.subtitle && (
            <p className="text-pop-xl font-bold mx-6 text-pink-500 font-comic">
              {news.subtitle}
            </p>
          )}
          <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
        </div>
        
        <div className="text-pop-lg mb-8 font-comic leading-relaxed text-black border-l-4 border-secondary-500 pl-6">
          {getPreview(news, 300)}
        </div>
        
        <div className="text-center">
          <InternalLink
            href={`furrettoday/leer/${news.id}`}
            className="btn-pop-secondary pop-focus animate-button-press inline-block"
          >
            {news.buttonText || "¡Leer la noticia completa!"}
          </InternalLink>
        </div>
      </CardContent>
    </Card>
  );
};

export default MainCard;