"use client";

import React, { useState } from 'react';
import MainCard from "./_components/MainCard";
import CardComponent from "./_components/CardComponent";
import PopStyles from "./_components/PopStyles";
import NewsManager from "./_components/NewsManager";
import { useGetNews } from "./_hooks/useGetNews";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  buttonText: string;
  imageUrl: string;
}

export default function FurretTodayPopArtEspanol() {
  const {featured, published} = useGetNews();

  return (
    <div className="min-h-full bg-yellow-200 text-black font-sans p-4 md:p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)]">
        <header className="bg-pink-500 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23fff%22 fill-opacity=%220.5%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
          <div className="relative z-10">
            <h1 className="text-8xl font-bold mb-2 text-yellow-300 pop-shadow">
              Noticiero Furret Today
            </h1>
            <p className="text-2xl italic text-white pop-shadow">
              ¡Las Noticias Pokémon Más POP-ulares!
            </p>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%22100%22 height=%22100%22%3E%3Cpath d=%22M50 0 L100 50 L50 100 L0 50 Z%22 fill=%22%23FFF700%22 /%3E%3C%2Fsvg%3E')] bg-center opacity-20"></div>
        </header>

        <nav className="bg-blue-500 p-4 flex justify-center space-x-4">
          <InternalLink href="/noticias/editar" className="bg-yellow-300 text-blue-500 font-bold text-xl transform hover:scale-110 transition-transform hover:bg-white px-4 py-2 rounded-full button-pop-shadow">
            Editar Noticias
          </InternalLink>
        </nav>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23000%22 fill-opacity=%220.1%22%2F%3E%3C%2Fsvg%3E')] bg-repeat">
          <MainCard news={featured} />

          <div className="space-y-6">
            <CardComponent variant="pink" news={published[0]} />
            <CardComponent variant="red" news={published[1]} />
            <CardComponent variant="yellow" news={published[2]} />
          </div>
        </main>

        {published.length > 3 && (
          <section className="p-6">
            <h2 className="text-5xl font-bold mb-6 text-center text-blue-500 pop-shadow">
              Más Noticias
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.slice(3).map((item, index) => (
                <CardComponent key={index} variant="blue" news={item} />
              ))}
            </div>
          </section>
        )}

        <footer className="bg-pink-500 text-white p-6 text-center">
          <p className="font-bold text-2xl pop-shadow">
            &copy; 2024 Furret Today. ¡Gracias por leernos, sin ti no podríamos
            CA-MI-NAR!
          </p>
        </footer>
      </div>
      <PopStyles />
    </div>
  );
}