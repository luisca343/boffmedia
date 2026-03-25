"use client";
import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, Texture } from "three";
import { useEffect, useRef, useState } from "react";
import {
  CameraShake,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Preload,
  View,
  useGLTF,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

const furnitureItems = [
  {
    name: "Sayori",
    title: "Modelo de Sayori",
    subtitle: "Conjunto",
    price: "100",
    description: "Un conjunto completo de Sayori, desde los pies a la cabeza.",
  },
  {
    name: "A",
    title: "Casco Lancero",
    subtitle: "Casco",
    price: "$50",
    description: "Un casco de lancero con detalles en oro.",
  },
  {
    name: "luffy",
    title: "Monkey D Luffy",
    subtitle: "Conjunto",
    price: "$150",
    description:
      "Un conjunto completo de Monkey D Luffy. Incluye su famoso sombrero de paja.",
  },
  {
    name: "piano",
    title: "Piano",
    subtitle: "Bloque",
    price: "$200",
    description: "Un piano de cola de tamaño real.",
  },
];

export default function BidkeaMenu() {
  const ref = useRef();

  return (
    <div className="min-h-full bg-[#f4e9d7] text-[#3e2723]">
      <header className="bg-[#8b4513] text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bidkea-IlaragMewET6XF5bGQdoTxGGKB1hAX.webp"
              alt="Bidkea Logo"
              className="w-12 h-12"
            />
            <h1 className="text-2xl font-bold">Bidkea</h1>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="search"
              placeholder="Buscar productos..."
              className="px-4 py-2 rounded-full text-[#3e2723]"
            />
            <Button variant="outline" className="rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6">Catálogo de Productos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {furnitureItems.map((item, index) => (
            <Card key={index} className="bg-white shadow-lg">
              <CardContent className="p-4">
                <ModelView name={item.name} />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-lg font-bold text-[#8b4513]">{item.price}</p>
                <p className="text-sm text-surface-600">{item.subtitle}</p>
                <div className="grid gap-4 mt-4">
                  <p className="text-sm">{item.description}</p>
                  <Button className="w-full bg-[#8b4513] hover:bg-[#6d370f] text-white">
                    Añadir al carrito
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="bg-[#8b4513] text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; 2023 Bidkea. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/** Fixed fullscreen canvas on top of everything, events tied to index root */}
      <Canvas
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
        eventSource={ref.current}
      >
        <View.Port />
        <Preload all />
      </Canvas>
    </div>
  );
}

function ModelView({ name, color = "" }: { name: string; color?: string }) {
  const [size, setSize] = useState(0);
  const [fov, setFov] = useState(0);

  useEffect(() => {
    fetch(`/smartrotom/armourers/model-exports/${name}.obj`)
      .then((response) => {
        const size = parseInt(response.headers.get("Content-Length") as string);
        setSize(size / 1024);
      })
      .catch(console.error);
  }, [name]);

  useEffect(() => {
    if (size <= 300) setFov(15);
    if (size > 300) setFov(30);
    if (size > 1500) setFov(40);
  }, [size]);

  return (
    <View
      className="view scale z-10 border-2 rounded-sm border-black"
      style={{ height: 200, width: 200 }}
    >
      {color && <color attach="background" args={[color]} />}
      <ambientLight intensity={0.5} />
      <pointLight position={[20, 30, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="blue" />
      <Environment preset="dawn" />

      <ArmourerModel name={name} />
      <OrbitControls makeDefault />
      <PerspectiveCamera makeDefault fov={fov} position={[90, 0, 0]} />
    </View>
  );
}

export function ArmourerModel({ name }: { name: string }) {
  const [obj, setObj] = useState(null as any);
  const texture = useLoader(
    TextureLoader,
    `/smartrotom/armourers/model-exports/${name}.png`
  );

  useEffect(() => {
    new MTLLoader()
      .setPath("/smartrotom/armourers/model-exports/")
      .load(`${name}.mtl`, function (materials) {
        materials.preload();
        new OBJLoader()
          .setMaterials(materials)
          .setPath("/smartrotom/armourers/model-exports/")
          .load(`${name}.obj`, function (object) {
            object.traverse(
              (child: any ) => {
                if (child.isMesh) {
                  child.material.map = texture;
                }
              }
            );
            setObj(object);
            console.log(object);
          });
      });
  }, [name, texture]);

  if (!obj) return <>LOADING</>;
  return <primitive object={obj} />;
}
