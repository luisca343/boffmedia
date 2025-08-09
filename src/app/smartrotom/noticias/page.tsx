"use client";

import React from 'react';
import MainCard from "./_components/MainCard";
import CardComponent from "./_components/CardComponent";
import PopStyles from "./_components/PopStyles";
import { InternalLink } from "@/components/nav/Link";
import FurretHeader from './_components/Header';
import FurretFooter from './_components/Footer';
import PopArtWallpaper from './_components/PopArtWallpaper';
import { useGetAllNews } from '@/hooks/documents/useGetAllNews';
import { Button } from "@/components/ui/button";

export interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  buttonText: string;
  imageUrl: string;
}

export default function FurretToday() {
  const {featured, published} = useGetAllNews();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-full relative overflow-auto">
      <div className="absolute inset-0">
        <PopArtWallpaper />
      </div>
      <div className="relative z-10 min-h-full text-black  p-2 md:p-8">
        <div className="max-w-7xl mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)] border-8 border-black flex flex-col">
          <FurretHeader />
          
          {/* Improved navigation */}
          <nav className="bg-gradient-to-r from-secondary-600 to-secondary-400 p-4 flex flex-wrap justify-center gap-4 relative">
            {/* Comic style splash behind buttons */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cpath d=%22M0 20 L20 0 L40 20 L20 40 Z%22 fill=%22%23FFF%22 fill-opacity=%220.1%22 /%3E%3C%2Fsvg%3E')] bg-repeat"></div>
            
            <Button onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="md:hidden bg-yellow-300 text-secondary-500 font-bold text-xl transition-all border-4 border-black hover:bg-yellow-100 button-pop-shadow rounded-full px-4 py-2">
              {isMenuOpen ? '✕ Cerrar' : '☰ Menú'}
            </Button>
            
            <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 w-full md:w-auto items-center`}>
              <InternalLink href="/noticias" className="bg-yellow-300 text-secondary-500 font-bold text-xl transform hover:scale-110 transition-transform hover:bg-white px-4 py-2 rounded-full button-pop-shadow border-4 border-black">
                Inicio
              </InternalLink>
              <InternalLink href="/noticias/editar" className="bg-yellow-300 text-secondary-500 font-bold text-xl transform hover:scale-110 transition-transform hover:bg-white px-4 py-2 rounded-full button-pop-shadow border-4 border-black">
                Editar Noticias
              </InternalLink>
              <InternalLink href="/" className="bg-yellow-300 text-secondary-500 font-bold text-xl transform hover:scale-110 transition-transform hover:bg-white px-4 py-2 rounded-full button-pop-shadow border-4 border-black">
                SmartRotom
              </InternalLink>
            </div>
          </nav>

          <div className="flex-grow">
            {/* Featured news section with improved styling */}
            <div className="bg-secondary-100 pt-6 px-4 pb-2">
              <div className="flex items-center mb-4">
                <div className="h-1 bg-black flex-grow"></div>
                <h2 className="text-4xl font-bold mx-4 text-pink-500 pop-shadow px-6 py-2 bg-yellow-300 border-4 border-black transform -rotate-2">
                  ¡ÚLTIMAS NOTICIAS!
                </h2>
                <div className="h-1 bg-black flex-grow"></div>
              </div>
            </div>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23000%22 fill-opacity=%220.1%22%2F%3E%3C%2Fsvg%3E')] bg-repeat">
              <MainCard news={featured!} />

              <div className="space-y-6">
                {published && published[0] && <CardComponent variant="pink" news={published[0]} />}
                {published && published[1] && <CardComponent variant="red" news={published[1]} />}
                {published && published[2] && <CardComponent variant="yellow" news={published[2]} />}
              </div>
            </main>

            {published && published.length > 3 && (
              <section className="p-6">
                <div className="flex items-center mb-6">
                  <div className="h-1 bg-black flex-grow"></div>
                  <h2 className="text-4xl font-bold mx-4 text-secondary-500 pop-shadow">
                    Más Noticias
                  </h2>
                  <div className="h-1 bg-black flex-grow"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {published.slice(3).map((item, index) => (
                    <CardComponent key={index} variant={index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "green"} news={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
          
          <FurretFooter />
        </div>
      </div>
      <PopStyles />
    </div>
  );
}