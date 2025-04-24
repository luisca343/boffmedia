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

const CustomEditor = dynamic(() => import("@/components/editor/TestEditor"), {
  ssr: false,
});

export default function ReadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { article, error, isLoading } = useGetNewsById(id);

  if (isLoading) {
    return (
      <div className="min-h-full bg-yellow-300 flex items-center justify-center">
        <Card className="w-96 bg-white border-8 border-black transform rotate-2">
          <CardContent className="p-6 text-center">
            <h2 className="text-4xl font-bold mb-4 pop-shadow text-blue-500">
              ¡CARGANDO!
            </h2>
            <p className="text-2xl font-comic mb-6">
              Furret está buscando tu noticia...
            </p>
            <div className="relative h-40 w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl animate-bounce">🔍</span>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <svg width="100" height="20">
                <line x1="0" y1="10" x2="100" y2="10" stroke="#000" strokeWidth="4" strokeDasharray="10 5" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-yellow-300 flex items-center justify-center p-4">
        <Card className="max-w-2xl bg-white border-8 border-black transform -rotate-1 shadow-[20px_20px_0_0_rgba(0,0,0,0.3)]">
          <CardContent className="p-8 text-center">
            <h2 className="text-6xl font-bold mb-4 pop-shadow text-red-500">
              ¡OOPS!
            </h2>
            <div className="relative w-64 h-64 mx-auto mb-6">
              <Image
                src="/smartrotom/img/apps/noticias/furret2.png"
                alt="Furret confundido"
                layout="fill"
                className="object-cover"
              />
              <div className="absolute left-10 w-full h-full flex items-start justify-start">
                <span className="text-7xl animate-pulse">❓</span>
              </div>
            </div>
            
            {/* Comic style speech bubble */}
            <div className="relative bg-yellow-300 border-4 border-black p-4 mb-8 mx-auto max-w-lg transform rotate-2">
              <div className="absolute h-6 w-6 bg-yellow-300 border-l-4 border-b-4 border-black transform rotate-45 -bottom-3 left-[calc(50%-12px)]"></div>
              <p className="text-3xl font-comic mb-2 text-black">
                ¡Oh no! Hubo un error al cargar el documento.
              </p>
              <p className="text-xl font-comic text-black">
                ¿Quizás Furret está jugando con los cables?
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <InternalLink
                href="/noticias"
                className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-6 rounded-full text-xl transform hover:scale-110 transition-transform button-pop-shadow border-4 border-black"
              >
                Volver a las Noticias
              </InternalLink>
              <Button
                onClick={() => window.location.reload()}
                className="bg-green-500 text-white hover:bg-green-600 font-bold py-2 px-6 rounded-full text-xl transform hover:scale-110 transition-transform button-pop-shadow border-4 border-black"
              >
                ¡Intentar de Nuevo!
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <div className="relative z-10 min-h-full p-4 md:p-8 overflow-auto">
        <div className="w-full max-w-7xl mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)] border-8 border-black flex flex-col">
          <FurretHeader />
          
          {/* Navigation breadcrumbs */}
          <div className="bg-blue-100 p-4 flex flex-wrap items-center font-comic">
            <InternalLink href="/noticias" className="text-blue-500 hover:underline">
              Inicio
            </InternalLink>
            <span className="mx-2"> &gt; </span>
            <span className="font-bold text-pink-500">Leyendo: {article?.title}</span>
          </div>
          
          {/* Article content */}
          <div className="p-8 relative flex-grow">
            {/* Comic style action burst */}
            <div className="absolute -right-4 -top-8 bg-yellow-300 text-red-500 p-4 rounded-full border-4 border-black transform rotate-12 z-10">
              <span className="font-bold text-xl">¡EXTRA!</span>
            </div>
            
            {/* Article title with dynamic design */}
            <div className="mb-8 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 border-4 border-black transform -rotate-1">
              <h1 className="text-5xl md:text-6xl font-bold text-white pop-shadow text-center font-comic">
                {article?.title}
              </h1>
            </div>
            
            {/* Comic style border */}
            <div className="border-8 border-black bg-white p-6">
              {/* Ben-Day dot pattern accent border */}
              <div className="border-8 border-dotted border-blue-200 p-4 relative">
                {/* Add comic style elements to the article background */}
                <div className="absolute top-4 right-4 opacity-10">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <path d="M20,0 L40,30 L80,40 L40,60 L30,100 L10,50 Z" fill="#ec4899" />
                  </svg>
                </div>
                <div className="absolute bottom-4 left-4 opacity-10">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <circle cx="50" cy="50" r="40" fill="#3b82f6" />
                  </svg>
                </div>
                
                {/* Editor component */}
                <div className="relative z-10 font-comic">
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
          
          {/* Navigation buttons */}
          <div className="bg-blue-100 p-8 text-center">
            <InternalLink
              href="/noticias"
              className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-4 px-8 rounded-full text-2xl transform hover:scale-110 transition-transform button-pop-shadow border-4 border-black inline-block"
            >
              Volver a las Noticias
            </InternalLink>
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