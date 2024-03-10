"use client"
import { App } from "@/types";
import Image from "next/image";
import {motion} from "framer-motion";
import Link from "next/link";

export  function AppLink({app} : {app: App}) {
  return (
    <motion.div
        whileHover={{ scale: 1.1 }}
         key={app.id} className=" m-auto hover:cursor-pointer">
        <Link href={`/smartrotom/${app.url}`}>
            <div className="w-24 h-24 sm:w-36 sm:h-36"><Image src={`http://i.lizardon.es/pixelmon/img/iconos/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
            <p className="text-white text-center text:2xl lg:text-2xl text-shadow-gray-border2">{app.name}</p>
        </Link>
    </motion.div>
  );
}