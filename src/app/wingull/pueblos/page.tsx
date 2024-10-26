'use client'

import Image from "next/image";
import { Suspense } from "react";
import { motion } from "framer-motion";
import Footer from "../_components/Footer";
import TownGrid from "./_components/TownGrid";

const towns = [
  "mizu", "tulipan", "lavanda", "tsuchi", "doku", "shiroi", 
  "denki", "yume", "olivo", "senshi", "kinoko", "takai", 
  "sakura", "hagane", "iwa", "gaku", "oasis", "dento"
];

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col text-white bg-blue-900">
      <header className="py-8 border-b border-blue-700 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <Image
            src="/img/win-full.png"
            alt="Logo de Pixelmon Wingull"
            width={250}
            height={125}
            className="mx-auto mb-6 drop-shadow-lg"
            priority
          />
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-yellow-300 drop-shadow-lg mb-2"
          >
            Inmobiliaria de Teras
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-blue-200"
          >
            Descubre tu hogar en los 18 maravillosos pueblos de la región de Teras
          </motion.div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-16 relative z-10">
        <Suspense fallback={<TownGridSkeleton />}>
          <TownGrid towns={towns} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function TownGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 18 }).map((_, index) => (
        <div key={index} className="bg-blue-800 bg-opacity-80 p-6 rounded-lg shadow-lg">
          <div className="w-full h-48 mb-4 bg-blue-700 animate-pulse" />
          <div className="w-3/4 h-6 mb-2 bg-blue-700 animate-pulse" />
          <div className="w-full h-4 bg-blue-700 animate-pulse" />
        </div>
      ))}
    </div>
  );
}