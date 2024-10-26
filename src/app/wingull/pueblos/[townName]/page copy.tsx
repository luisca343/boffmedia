"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import FondoWaves from "./_components/FondoWaves";

export default function FormularioEntrada() {
  const { townName } = useParams();
  const [datos, setDatos] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const fetchTownData = async () => {
      try {
        const response = await fetch(
          `/smartrotom/img/pueblos/${townName}/textos.json`
        );
        if (response.ok) {
          const data = await response.json();
          setDatos(data);
        } else {
          console.warn(
            `No textos.json found for ${townName}, using default data.`
          );
        }
      } catch (error) {
        console.error(`Error loading textos.json for ${townName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTownData();
  }, [townName]);

  if (!datos) return null;

  return (
    <div className="min-h-full bg-cover bg-center bg-fixed overflow-auto">
      <div className="w-full md:w-4/5 mx-auto bg-white">
        <div className="flex justify-around h-20">
          {["tomasnook", "constructorasburr", "wingull2"].map((logo) => (
            <Image
              key={logo}
              src={`/smartrotom/img/logos/${logo}.webp`}
              alt={`${logo} logo`}
              width={80}
              height={80}
              className="h-full w-auto"
            />
          ))}
        </div>

        <div
          className="h-[600px] bg-cover bg-center flex items-start"
          style={{
            backgroundImage: `url(/smartrotom/img/pueblos/${townName}/fondo.webp)`,
          }}
        >
          <div className="m-4 p-4 w-full md:w-1/2 bg-white bg-opacity-90 border border-gray-800">
            <div className="w-4/5 mx-auto mt-4 border-4 border-white p-4">
              <div className="text-4xl font-bold" style={{ color }}>
                Pueblo
              </div>
              <div className="text-6xl text-white font-bold">
                EXAMPLE PUEBLO
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {datos.frasebonita}
              </div>
            </div>
            <div className="m-4 p-4 text-2xl" style={{ color }}>
              {datos.descripcion}
            </div>
          </div>
        </div>

        <FondoWaves color={datos.color}>
          <section className="py-12" style={{ backgroundColor: color }}>
            <h2 className="text-4xl font-bold text-center text-white mb-4">
              PARCELAS HABITABLES
            </h2>
            <p className="text-xl text-center text-white mb-8">
              Extensión inicial de 10x10 bloques señalados. Expansiones se
              venden por separado.
            </p>
            <div className="flex flex-wrap justify-around">
              {datos.parcelas.map((parcela: any, index: number) => (
                <a
                  key={index}
                  href={`#parcela${index + 1}`}
                  className="w-full md:w-[30%] mb-8 group"
                >
                  <div
                    className="bg-white text-center py-2 text-xl font-bold"
                    style={{ color }}
                  >
                    {`Parcela 00${index + 1}`}
                  </div>
                  <div className="relative overflow-hidden">
                    <Image
                      src={`/smartrotom/img/pueblos/${townName}/parcela${
                        index + 1
                      }-preview.webp`}
                      alt={`Parcela ${index + 1}`}
                      width={400}
                      height={225}
                      className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </a>
              ))}
            </div>
          </section>
        </FondoWaves>

        {datos.parcelas.map((parcela: any, index: number) => (
          <section
            key={index}
            id={`parcela${index + 1}`}
            className="py-12"
            style={{ backgroundColor: color }}
          >
            <div className="w-full md:w-2/3 mx-auto bg-white p-8">
              <div className="border-4 border-gray-200 mb-8">
                <Image
                  src={`/smartrotom/img/pueblos/${townName}/parcela${
                    index + 1
                  }-detalle.webp`}
                  alt={`Detalle Parcela ${index + 1}`}
                  width={800}
                  height={450}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col md:flex-row items-center mb-8">
                <h3 className="text-3xl font-bold mr-4">PARCELA {index + 1}</h3>
                <p className="text-xl" style={{ color }}>
                  {parcela.info}
                </p>
              </div>
              <div>
                <h4
                  className="text-3xl font-bold mb-4 pb-2 border-b-2"
                  style={{ borderColor: color }}
                >
                  SOBRE LA PARCELA
                </h4>
                <p className="text-xl mb-8">{parcela.detalle}</p>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                  <Image
                    src={`/smartrotom/img/pueblos/${townName}/parcela${
                      index + 1
                    }-extra1.webp`}
                    alt={`Extra 1 Parcela ${index + 1}`}
                    width={300}
                    height={200}
                    className="w-full md:w-1/3 transform -rotate-6"
                  />
                  <Image
                    src={`/smartrotom/img/pueblos/${townName}/parcela${
                      index + 1
                    }-extra2.webp`}
                    alt={`Extra 2 Parcela ${index + 1}`}
                    width={300}
                    height={200}
                    className="w-full md:w-1/3 transform rotate-6"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        <ChevronDown className="w-12 h-12 mx-auto mt-8 text-white animate-bounce" />
      </div>
    </div>
  );
}
