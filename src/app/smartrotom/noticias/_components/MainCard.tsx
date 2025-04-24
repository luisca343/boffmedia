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
      <Card className="col-span-1 md:col-span-2 overflow-hidden transform hover:scale-[1.025] transition-transform bg-yellow-300 border-8 border-black relative">
        <div className="absolute top-0 right-0 bg-red-500 text-white py-1 px-4 font-bold text-xl transform rotate-12 z-10 border-4 border-black">
          ¡EXCLUSIVA!
        </div>
        <CardContent className="p-6 relative">
          <h2 className="text-6xl font-bold text-red-500 pop-shadow mb-4">
            ¡OOPS!
          </h2>
          <p className="text-3xl mb-4 font-comic leading-relaxed text-black">
            ¡Parece que Furret se ha comido la noticia principal!
          </p>
          <div className="relative w-full h-64 mb-4">
            <Image
              src="/smartrotom/img/apps/noticias/furret2.png"
              alt="Furret comiendo papel"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </CardContent>
      </Card>
    );

  const image = news.imageUrl
    ? news.imageUrl
    : "/smartrotom/img/apps/noticias/default.webp";
    
  return (
    <Card className="col-span-1 md:col-span-2 overflow-hidden transform hover:scale-[1.025] transition-transform bg-white border-8 border-black relative">
      {/* News Flash Banner */}
      <div className="absolute top-4 right-0 bg-red-500 text-white py-2 px-6 font-bold text-xl transform rotate-12 z-10 border-4 border-black pop-shadow">
        ¡ÚLTIMA HORA!
      </div>
      
      <div className="relative h-96">
        <Image src={image} alt={news.title} layout="fill" objectFit="cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-500 mix-blend-multiply opacity-30"></div>
        
        {/* Comic style speech bubble */}
        <div className="absolute top-4 left-4 bg-yellow-300 border-4 border-black p-4 max-w-[70%] transform -rotate-2 shadow-xl">
          <div className="absolute h-6 w-6 bg-yellow-300 border-r-4 border-b-4 border-black transform rotate-45 -bottom-3 left-8"></div>
          <h2 className="text-4xl md:text-6xl font-bold text-black leading-tight">
            {news.title}
          </h2>
        </div>
      </div>
      
      <CardContent className="p-6 relative">
        <div className="flex items-center mb-4">
          <div className="h-1 bg-black flex-grow"></div>
          {news.subtitle && (
            <p className="text-2xl font-bold mx-4 text-pink-500">
              {news.subtitle}
            </p>
          )}
          <div className="h-1 bg-black flex-grow"></div>
        </div>
        
        <div className="text-2xl mb-6 font-comic leading-relaxed text-black border-l-8 border-blue-500 pl-4">
          {getPreview(news, 300)}
        </div>
        
        <div className="text-center">
          <InternalLink
            href={`/noticias/leer/${news.id}`}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full transform hover:scale-110 transition-transform text-xl button-pop-shadow inline-block border-4 border-black"
          >
            {news.buttonText || "¡Leer la noticia completa!"}
          </InternalLink>
        </div>
      </CardContent>
    </Card>
  );
};

export default MainCard;