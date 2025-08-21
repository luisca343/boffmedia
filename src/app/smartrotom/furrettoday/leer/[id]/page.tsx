"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";
import Image from "next/image";
import FurretHeader from "../../_components/Header";
import FurretFooter from "../../_components/Footer";
import { useGetNewsById } from "@/hooks/documents/useGetNewsById";
import PopArtWallpaper from "../../_components/PopArtWallpaper";
import PopStyles from "../../_components/PopStyles";

const CustomEditor = dynamic(() => import("@/components/ckeditor/TestEditor"), {
  ssr: false,
});

export default function ReadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { article, error, isLoading } = useGetNewsById(id);

  if (isLoading) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="bg-yellow-300 card-pop p-8 text-center max-w-2xl">
            <h2 className="text-pop-4xl font-bold mb-6 text-secondary-500 pop-shadow">
              ¡CARGANDO! 📰
            </h2>
            <p className="text-pop-xl font-comic mb-8 text-secondary-600">
              Furret está preparando tu noticia...
            </p>
            <div className="relative h-40 w-full mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-8 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl animate-bounce">🔍</span>
              </div>
            </div>
            {/* Comic-style action lines */}
            <svg className="mx-auto" width="200" height="40" viewBox="0 0 200 40">
              <line x1="0" y1="20" x2="200" y2="20" stroke="#000" strokeWidth="4" strokeDasharray="10 5" />
              <line x1="20" y1="30" x2="180" y2="30" stroke="#000" strokeWidth="2" strokeDasharray="8 4" />
            </svg>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="max-w-3xl bg-white card-pop p-8 text-center">
            <h2 className="text-pop-4xl font-bold mb-6 pop-shadow text-red-500">
              ¡OOPS! 💥
            </h2>
            <div className="relative w-64 h-64 mx-auto mb-8">
              <Image
                src="/smartrotom/img/apps/furrettoday/furret2.png"
                alt="Furret confundido"
                layout="fill"
                className="object-contain"
              />
              <div className="absolute -top-4 -right-4 animate-pulse">
                <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center border-4 border-black transform rotate-12">
                  <span className="text-2xl">❓</span>
                </div>
              </div>
            </div>
            
            {/* Comic style speech bubble */}
            <div className="relative bg-yellow-300 border-4 border-black p-6 mb-8 mx-auto max-w-lg transform rotate-1 card-pop">
              <div className="absolute h-6 w-6 bg-yellow-300 border-r-4 border-b-4 border-black transform rotate-45 -bottom-3 left-[calc(50%-12px)]"></div>
              <p className="text-pop-xl font-comic mb-3 text-black pop-shadow">
                ¡Oh no! Hubo un error al cargar la noticia.
              </p>
              <p className="text-pop-lg font-comic text-secondary-600">
                ¿Quizás Furret está jugando con los cables? 🔌
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <InternalLink
                href="furrettoday"
                className="btn-pop-primary pop-focus animate-button-press"
              >
                🏠 Volver a las Noticias
              </InternalLink>
              <button
                onClick={() => window.location.reload()}
                className="btn-pop-secondary pop-focus animate-button-press"
              >
                🔄 ¡Intentar de Nuevo!
              </button>
            </div>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  function getContent() {
    const modifiedContent = article?.content.replace(/<h1>.*?<\/h1>/, "<h1></h1>");
    console.log(modifiedContent);
    return modifiedContent;
  }

  function getModifiedData() {
    return {
      ...article,
      content: getContent(),
    };
  }

  return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full text-black p-4 md:p-8">
          <div className="max-w-7xl mx-auto bg-white card-pop flex flex-col  overflow-hidden">
            <FurretHeader />
          
          {/* Navigation breadcrumbs - Enhanced */}
          <div className="bg-secondary-100 p-6 flex flex-wrap items-center font-comic border-b-4 border-black">
            <InternalLink href="furrettoday" className="text-secondary-500 hover:underline text-pop-lg pop-focus">
              🏠 Inicio
            </InternalLink>
            <span className="mx-3 text-pop-lg font-bold"> ⚡ </span>
            <span className="font-bold text-pink-500 text-pop-lg pop-shadow">
              📖 Leyendo: {article?.title}
            </span>
            
            {/* Action button in breadcrumb bar */}
            <div className="ml-auto">
              <InternalLink
                href="furrettoday"
                className="btn-pop-primary pop-focus animate-button-press"
              >
                📰 Todas las Noticias
              </InternalLink>
            </div>
          </div>
          
          {/* Article content - Enhanced */}
          <div className="p-8 relative flex-grow">
            {/* Hero section with improved title design */}
            <div className="relative mb-12">
              {/* Comic-style burst backgrounds */}
              <div className="absolute -top-8 -right-8 w-24 h-24 opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-12">
                  <path d="M50,5 L60,35 L90,35 L70,55 L80,85 L50,70 L20,85 L30,55 L10,35 L40,35 Z" 
                        fill="#EC4899" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
              
              {/* Main title container */}
              <div className="relative">
                {/* "EXTRA" badge */}
                <div className="absolute -top-6 -right-6 bg-red-500 text-white px-6 py-3 rounded-2xl border-4 border-black transform rotate-12 z-10 card-pop">
                  <span className="font-bold text-pop-lg pop-shadow">¡EXTRA!</span>
                </div>
                
                {/* Title with improved styling */}
                <div className="bg-gradient-to-r from-pink-500 via-yellow-400 to-red-500 p-8 border-4 border-black transform -rotate-1 card-pop relative overflow-hidden">
                  {/* Subtle halftone pattern */}
                  <div className="absolute inset-0 ben-day-dots opacity-20"></div>
                  
                  <h1 className="relative z-10 text-pop-3xl md:text-pop-4xl font-bold text-white pop-shadow-strong text-center leading-tight">
                    {article?.title}
                  </h1>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-300 rounded-full border-3 border-black"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-white rounded-full border-3 border-black"></div>
                </div>
              </div>
            </div>
            
            {/* Content area with enhanced design */}
            <div className="relative">
              {/* Main content container */}
              <div className="bg-white border-8 border-black rounded-3xl p-8 relative overflow-hidden card-pop">
                {/* Decorative background elements */}
                <div className="absolute top-8 right-8 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 100 100" width="120" height="120" className="transform rotate-45">
                    <path d="M20,0 L40,30 L80,40 L40,60 L30,100 L10,50 Z" fill="#EC4899" />
                  </svg>
                </div>
                <div className="absolute bottom-8 left-8 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="40" fill="#3B82F6" />
                  </svg>
                </div>
                
                {/* Inner content border */}
                <div className="border-4 border-dotted border-secondary-300 p-6 rounded-2xl bg-gray-50 relative">
                  {/* Corner decorations */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 border-3 border-black rounded-full flex items-center justify-center transform rotate-12">
                    <span className="text-black font-bold text-pop-sm">✨</span>
                  </div>
                  
                  {/* Article content */}
                  <div className="relative z-10 font-comic prose prose-lg max-w-none">
                    <CustomEditor
                      document={getModifiedData()}
                      documentId={id}
                      documentType={1}
                      readonly={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation buttons - Enhanced */}
          <div className="bg-secondary-100 p-8 text-center border-t-4 border-black relative">
            {/* Background pattern */}
            <div className="absolute inset-0 ben-day-dots opacity-30"></div>
            
            <div className="relative z-10">
              <h3 className="text-pop-xl font-bold mb-6 text-secondary-600 pop-shadow">
                📰 ¿Te gustó esta noticia?
              </h3>
              
              <div className="flex flex-wrap justify-center gap-6">
                <InternalLink
                  href="furrettoday"
                  className="btn-pop-primary pop-focus animate-button-press"
                >
                  🏠 Volver a las Noticias
                </InternalLink>
                
                <InternalLink
                  href="furrettoday/editar"
                  className="btn-pop-secondary pop-focus animate-button-press"
                >
                  ✏️ Editor de Noticias
                </InternalLink>
              </div>
              
              {/* Fun message */}
              <div className="mt-8 bg-yellow-300 inline-block px-6 py-3 border-3 border-black rounded-2xl transform rotate-1 card-pop">
                <p className="text-pop-base font-comic text-secondary-600 pop-shadow">
                  ¡Gracias por leer Furret Today! 🎉
                </p>
              </div>
            </div>
          </div>

          <FurretFooter />
        </div>
      </div>
      <PopStyles />
      
    <style jsx global>{`
      .ck-placeholder{
        display: none !important;
      }
    `}</style>
    </div>
  );
}