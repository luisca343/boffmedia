// @ts-nocheck
"use client";
import React from "react";
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
import { ASSET, staticAsset } from "@/lib/assets";
import { useTranslations } from "next-intl";
import { Icon } from "@boffmedia/ui";

const furnitureItems = [
  {
    name: "Sayori",
    titleKey: "items.sayoriTitle",
    subtitleKey: "categories.conjunto",
    price: "100",
    descriptionKey: "items.sayoriDesc",
  },
  {
    name: "A",
    titleKey: "items.lancerHelmetTitle",
    subtitleKey: "categories.casco",
    price: "$50",
    descriptionKey: "items.lancerHelmetDesc",
  },
  {
    name: "luffy",
    titleKey: "items.luffyTitle",
    subtitleKey: "categories.conjunto",
    price: "$150",
    descriptionKey: "items.luffyDesc",
  },
  {
    name: "piano",
    titleKey: "items.pianoTitle",
    subtitleKey: "categories.bloque",
    price: "$200",
    descriptionKey: "items.pianoDesc",
  },
];

export default function BidkeaMenu() {
  const t = useTranslations("bidkea");
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-full bg-[#f4e9d7] text-[#3e2723]">
      <header className="bg-[#8b4513] text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bidkea-IlaragMewET6XF5bGQdoTxGGKB1hAX.webp"
              alt={t("header.logoAlt")}
              className="w-12 h-12"
            />
            <h1 className="text-2xl font-bold">Bidkea</h1>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="search"
              placeholder={t("header.searchPh")}
              className="px-4 py-2 rounded-full text-[#3e2723]"
            />
            <Button variant="outline" className="rounded-full">
              <Icon name="shoppingCart" size={24} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6">{t("catalog.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {furnitureItems.map((item, index) => (
            <Card key={index} className="bg-white shadow-lg">
              <CardContent className="p-4">
                <ModelView name={item.name} />
                <h3 className="text-xl font-semibold mb-2">{t(item.titleKey)}</h3>
                <p className="text-lg font-bold text-[#8b4513]">{item.price}</p>
                <p className="text-sm text-ink-dim">{t(item.subtitleKey)}</p>
                <div className="grid gap-4 mt-4">
                  <p className="text-sm">{t(item.descriptionKey)}</p>
                  <Button className="w-full bg-[#8b4513] hover:bg-[#6d370f] text-white">
                    {t("catalog.addToCart")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="bg-[#8b4513] text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p>{t("footer.rights")}</p>
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
        eventSource={ref as React.MutableRefObject<HTMLElement>}
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
    fetch(staticAsset(ASSET.smartrotom.armourers, 'model-exports', `${name}.obj`))
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
  const t = useTranslations("bidkea");
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
          });
      });
  }, [name, texture]);

  if (!obj) return <>{t("catalog.loading")}</>;
  return <primitive object={obj} />;
}
