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

const CustomEditor = dynamic(() => import("@/components/editor/TestEditor"), {
  ssr: false,
});

export default function ReadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { article, error, isLoading } = useGetNewsById(id);

  if (isLoading) {
    return (
      <div className="min-h-full bg-yellow-300 flex items-center justify-center">
        <Card className="w-96 bg-white border-8 border-black">
          <CardContent className="p-6 text-center">
            <h2 className="text-4xl font-bold mb-4 pop-shadow text-blue-500">
              ¡CARGANDO!
            </h2>
            <p className="text-2xl font-comic mb-4">
              Furret está buscando tu noticia...
            </p>
            <div className="mt-4 animate-bounce">
              <span className="text-6xl">🔍</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-yellow-300 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white border-8 border-black">
          <CardContent className="p-6 text-center">
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
                <span className="text-7xl">❓</span>
              </div>
            </div>
            <p className="text-3xl font-comic mb-6">
              ¡Oh no! Hubo un error al cargar el documento. ¿Quizás Furret está jugando con los cables?
            </p>
            <div className="flex justify-center space-x-4">
              <InternalLink
                href="/noticias"
                className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-6 rounded-full text-xl transform hover:scale-110 transition-transform button-pop-shadow"
              >
                Volver a las Noticias
              </InternalLink>
              <Button
                onClick={() => window.location.reload()}
                className="bg-green-500 text-white hover:bg-green-600 font-bold py-6 px-6 rounded-full text-xl transform hover:scale-110 transition-transform button-pop-shadow"
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
    <div className="min-h-full bg-yellow-200 text-black font-sans p-4 md:p-8 overflow-hidden">
      <div className="w-[80%] mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)] ">
        <FurretHeader />
          <Card>
            <CardContent className="p-8">
              <h1 className="text-6xl font-bold mb-6 text-red-500 pop-shadow text-center">
                {article?.title}
              </h1>
              <CustomEditor
                document={getModifiedData()}
                documentId={id}
                documentType={1}
                readonly={true}
              />
            </CardContent>
          </Card>
          <div className="text-center  py-4">
            <InternalLink
              href="/noticias"
              className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-4 px-8 rounded-full text-2xl transform hover:scale-110 transition-transform button-pop-shadow inline-block"
            >
              Volver a las Noticias
            </InternalLink>
          </div>

          <FurretFooter />
      </div>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&display=swap");

        h1,
        h2,
        h3 {
          font-family: "Bangers", cursive;
          letter-spacing: 2px;
        }

        .font-comic {
          font-family: "Comic Neue", cursive;
        }

        .pop-shadow {
          text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
            -1px 1px 0 #000, 1px 1px 0 #000;
        }

        .button-pop-shadow {
          text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
            -1px 1px 0 #000, 1px 1px 0 #000;
        }
        .ck.ck-editor__editable .ck.ck-editor__editable_inline {
          border: 0px solid !important;
        }

        h1.ck-placeholder {
          display: none;
        }
      `}</style>
    </div>
  );
}

