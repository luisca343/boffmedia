"use client"
import { App } from "@/types";
import Image from "next/image";
import {motion} from "framer-motion";
import Link from "next/link";

import { animations } from "@formkit/drag-and-drop";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function AppList() {
  const {data: session} = useSession()  as any
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    rotomPOST('/apps/player',{uuid: session?.user?.smartRotomUser?.uuid}).then((res: App[]) => {
      setApps(res);
    });
  }, [session?.user?.smartRotomUser?.uuid]);

  if(apps.length === 0) return (<></>)
  return (
    <ReorderableAppList apps={apps} />
  );

}

export function ReorderableAppList({apps} : {apps: App[]}) {
  const {data: session} = useSession()  as any
  const [parent, _apps] = useDragAndDrop<HTMLUListElement, App>(apps, {
    plugins: [animations()],
    handleEnd: () => {
      let newOrder = []
      for (let i = 0; i < _apps.length; i++) {
        newOrder.push({id:_apps[i].id, order: i});
      }
      rotomPOST('/apps/order', {newOrder, uuid: session?.user?.smartRotomUser?.uuid});
    }
  });

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-between gap-y-1 pb-4 overflow-auto flex-1" ref={parent}>
      {_apps.map(app => <AppLink app={app} key={app.id} />)}
    </ul>
  );
}

export  function AppLink({app} : {app: App}) {
  return (
    <motion.li
        whileHover={{ scale: 1.1 }}
         key={app.id} className=" m-auto hover:cursor-pointer">
        <Link href={`/smartrotom/${app.url}`}>
            <div className="w-24 h-24 sm:w-36 sm:h-36"><Image src={`/smartrotom/img/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
            <p className="text-white text-center text:2xl lg:text-2xl text-shadow-gray-border2">{app.name}</p>
        </Link>
    </motion.li>
  );
}