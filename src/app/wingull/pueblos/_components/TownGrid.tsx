'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TownData {
  color: string;
  frasebonita: string;
}

export default function TownGrid({ towns }: { towns: string[] }) {
  const [townData, setTownData] = useState<Record<string, TownData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTownData = async () => {
      try {
        const responses = await Promise.all(
          towns.map(town => fetch(`/smartrotom/img/pueblos/${town}/textos.json`))
        );

        const data = await Promise.all(
          responses.map(response => response.ok ? response.json() : null)
        );

        const newTownData = towns.reduce((acc, town, index) => {
          if (data[index]) {
            acc[town] = data[index];
          }
          return acc;
        }, {} as Record<string, TownData>);

        setTownData(newTownData);
      } catch (error) {
        console.error("Error loading town data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTownData();
  }, [towns]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {towns.map((town, index) => (
        <motion.div
          key={town}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link href={`/wingull/pueblos/${town}`} className="group">
            <div 
              className="bg-blue-800 bg-opacity-80 p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-opacity-50"
              style={{ borderColor: townData[town]?.color || "#4A90E2" }}
            >
              <div className="relative mb-4 overflow-hidden rounded-md">
                {loading ? (
                  <div className="w-full h-48 bg-blue-700 animate-pulse" />
                ) : (
                  <Image
                    src={`/smartrotom/img/pueblos/${town}/parcela1-preview.png`}
                    alt={`Pueblo ${town}`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-yellow-300 capitalize group-hover:text-yellow-200 transition-colors duration-300">
                {town}
              </h2>
              <div className="text-blue-200 group-hover:text-white transition-colors duration-300">
                {loading ? (
                  <div className="w-full h-4 bg-blue-700 animate-pulse" />
                ) : (
                  townData[town]?.frasebonita || "No data available"
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}