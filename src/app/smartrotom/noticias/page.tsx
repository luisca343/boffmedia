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

export interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  buttonText: string;
  imageUrl: string;
}

export default function FurretTodayPopArtEspanol() {
  const {featured, published} = useGetAllNews();

  return (
    <div className="min-h-full relative  overflow-auto">
      <div className="absolute inset-0">
        <PopArtWallpaper />
      </div>
      <div className="relative z-10 min-h-full text-black font-sans p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)]">
          <FurretHeader />
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
          <FurretFooter />
        </div>
      </div>
      <PopStyles />
    </div>
  );
}