"use client";

import React from 'react';
import MainCard from "./_components/MainCard";
import CardComponent from "./_components/CardComponent";
import PopStyles from "./_components/PopStyles";
import { InternalLink } from "@/components/ui/navigation/Link";
import FurretHeader from './_components/Header';
import FurretFooter from './_components/Footer';
import PopArtWallpaper from './_components/PopArtWallpaper';
import { useGetAllNews } from '@/hooks/documents/useGetAllNews';
import { Button } from "@/components/ui/primitives/button";

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
      <div className="relative z-10 min-h-full text-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto bg-white card-pop flex flex-col overflow-hidden">
          <FurretHeader />
          
          {/* Improved navigation with 8pt grid spacing */}
          <nav 
            id="main-navigation"
            className="bg-gradient-to-r from-secondary-active to-secondary-hover p-6 flex flex-wrap justify-center gap-4 relative"
            role="navigation"
            aria-label="Navegación principal"
          >
            {/* Subtle halftone pattern - positioned behind content */}
            <div className="absolute inset-0 ben-day-dots" aria-hidden="true"></div>
            
            <div className="relative z-10 w-full flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="md:hidden btn-pop-primary pop-focus animate-button-press"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMenuOpen ? '✕ Cerrar' : '☰ Menú'}
              </Button>
              
              <div 
                id="mobile-navigation"
                className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 w-full md:w-auto items-center justify-center`}
              >
                <InternalLink 
                  href="furrettoday" 
                  className="btn-pop-primary pop-focus animate-button-press"
                >
                  Inicio
                </InternalLink>
                <InternalLink 
                  href="furrettoday/editar" 
                  className="btn-pop-primary pop-focus animate-button-press"
                >
                  Editar Noticias
                </InternalLink>
                <InternalLink 
                  href="" 
                  className="btn-pop-secondary pop-focus animate-button-press"
                >
                  SmartRotom
                </InternalLink>
              </div>
            </div>
          </nav>

          <div className="flex-grow">
            {/* Featured news section with improved contrast and spacing */}
            <section className="bg-secondary-soft py-8 px-6">
              <div className="flex items-center mb-6">
                <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
                <h2 className="text-pop-3xl font-bold mx-6 text-pink-500 pop-shadow-strong px-8 py-4 bg-yellow-300 border-3 border-black transform -rotate-2 rounded-lg">
                  ¡ÚLTIMAS NOTICIAS!
                </h2>
                <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
              </div>
            </section>

            <main 
              id="main-content"
              className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 relative"
              role="main"
              aria-label="Contenido principal de noticias"
            >
              {/* Add subtle background pattern without interfering with content */}
              <div className="absolute inset-0 ben-day-dots" aria-hidden="true"></div>
              
              <div className="relative z-10 col-span-1 md:col-span-2">
                <MainCard news={featured!} />
              </div>

              <section aria-label="Noticias destacadas" className="relative z-10">
                <div className="space-y-8">
                  {published && published[0] && <CardComponent variant="pink" news={published[0]} />}
                  {published && published[1] && <CardComponent variant="red" news={published[1]} />}
                  {published && published[2] && <CardComponent variant="yellow" news={published[2]} />}
                </div>
              </section>
            </main>

            {published && published.length > 3 && (
              <section className="p-8 relative bg-white/90" aria-label="Más noticias">
                <div className="flex items-center mb-8">
                  <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
                  <h2 className="text-pop-2xl font-bold mx-6 text-secondary pop-shadow">
                    Más Noticias
                  </h2>
                  <div className="h-1 bg-black flex-grow" aria-hidden="true"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {published.slice(3).map((item, index) => (
                    <CardComponent key={item.id} variant={index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "green"} news={item} />
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