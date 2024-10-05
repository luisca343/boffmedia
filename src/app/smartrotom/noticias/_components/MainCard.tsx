import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalLink } from '@/components/nav/Link';
import { NewsItem } from '../page';

interface MainCardProps {
  news: NewsItem;
}

const MainCard: React.FC<MainCardProps> = ({ news }) => {
  return (
    <Card className="col-span-1 md:col-span-2 overflow-hidden transform hover:scale-[1.025] transition-transform bg-white border-4 border-black">
      <div className="relative h-96">
        <Image
          src={news.imageUrl}
          alt={news.title}
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-500 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
          <h2 className="text-6xl font-bold text-white pop-shadow mr-4">{news.title}</h2>
          <p className="text-2xl font-bold text-white pop-shadow">{news.subtitle}</p>
        </div>
      </div>
      <CardContent className="p-6 relative">
        <p className="text-2xl mb-4 font-comic leading-relaxed">{news.content}</p>
        <InternalLink href={`/noticias/leer/${news.id}`} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full transform hover:scale-110 transition-transform text-xl button-pop-shadow">
            {news.buttonText}
        </InternalLink>
      </CardContent>
    </Card>
  );
};

export default MainCard;