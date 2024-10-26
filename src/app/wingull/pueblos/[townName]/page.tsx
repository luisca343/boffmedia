

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

import Header from './_components/Header';
import LogoSection from './_components/LogoSection';
import HeroSection from './_components/HeroSection';
import ParcelaPreview from './_components/ParcelaPreview';
import ParcelaSection from './_components/ParcelaSection';
import { BackgroundDecorations } from '../../_components/BackgroundDecorations';
import Footer from '../../_components/Footer';

interface Parcela {
  info: string;
  detalle: string;
}

interface TownData {
  color: string;
  frasebonita: string;
  descripcion: string;
  parcelas: Parcela[];
}

const defaultTownData: TownData = {
  color: "#4A90E2",
  frasebonita: "Descubre el encanto único de esta ciudad en la región de Teras.",
  descripcion: "Una hermosa ciudad en la región de Teras, que ofrece experiencias únicas para entrenadores Pokémon.",
  parcelas: [
    { info: "Parcela residencial", detalle: "Ideal para construir tu hogar de ensueño." },
    { info: "Terreno comercial", detalle: "Perfecto para un centro Pokémon o una tienda." },
    { info: "Zona verde", detalle: "Espacio para crear un hermoso parque Pokémon." },
    { info: "Área de entrenamiento", detalle: "Lugar ideal para entrenar a tus Pokémon." },
    { info: "Terreno con vista", detalle: "Increíbles vistas panorámicas de la región." }
  ]
};

export default function TownPage() {
  const { townName } = useParams();
  const [townData, setTownData] = useState<TownData>(defaultTownData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTownData = async () => {
      try {
        const response = await fetch(`/smartrotom/img/pueblos/${townName}/textos.json`);
        if (response.ok) {
          const data = await response.json();
          setTownData(data);
        } else {
          console.warn(`No textos.json found for ${townName}, using default data.`);
        }
      } catch (error) {
        console.error(`Error loading textos.json for ${townName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTownData();
  }, [townName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white">
        <div className="text-2xl font-semibold">Cargando información de {townName}...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-blue-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <HeroSection 
          townName={townName as string} 
          color={townData.color}
          frasebonita={townData.frasebonita}
          descripcion={townData.descripcion}
        />

        <section className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-6 text-yellow-300"
          >
            PARCELAS HABITABLES
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-center mb-8 text-blue-200"
          >
            Extensión inicial de 10x10 bloques señalados. Expansiones se venden por separado.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {townData.parcelas.map((_, index) => (
              <ParcelaPreview 
                key={index} 
                index={index} 
                townName={townName as string} 
                backgroundColor={townData.color} 
              />
            ))}
          </div>
        </section>

        {townData.parcelas.map((parcela, index) => (
          <ParcelaSection 
            key={index}
            index={index}
            townName={townName as string}
            parcela={parcela}
          />
        ))}
      </main>

      <Footer />
    </div>
  );
}