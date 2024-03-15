"use client"
import { App } from "@/types";
import Image from "next/image";
import {motion} from "framer-motion";
import Link from "next/link";
import { DndContext, DragEndEvent, closestCenter, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import {MouseSensor, useSensor} from '@dnd-kit/core';
import { rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

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
    <SortableGrid apps={apps} setApps={setApps} />
  );
}

export function SortableGrid({className, apps, setApps}  : {className?: string, apps: App[], setApps: Function}) {
  const {data: session} = useSession()  as any
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);


  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const {active, over} = event;

    if (over && active.id !== over.id) {
      const apps2 = arrayMove(apps, apps.indexOf(apps.find(app => app.id === active.id) as App), apps.indexOf(apps.find(app => app.id === over.id) as App));
      const newOrder = apps2.map(app => ({id: app.id, order: apps2.indexOf(app)}));
      rotomPOST('/apps/order', {newOrder, uuid: session?.user?.smartRotomUser?.uuid});

      setApps(apps2);
      }
  }, [apps, setApps, session]);

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter} sensors={sensors}>
      <SortableContext items={apps} strategy={rectSortingStrategy} >
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-between gap-y-1 pb-4 overflow-auto flex-1">
            {apps.map((app, index) => (
            <SortableItem key={`app-${index}`} app={app}/>
            ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({app} : {app: App}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    active,
    
  } = useSortable({id: app.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="m-auto hover:cursor-pointer">
      {active ? <div >
                    <div className="w-24 h-24 sm:w-36 sm:h-36"><Image src={`/smartrotom/img/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
                      <p className="text-white text-center text:2xl lg:text-2xl text-shadow-gray-border2">{app.name}</p>
                  </div> : 
       <motion.div
              whileHover={{ scale: 1.1 }}
               key={app.id} className=" m-auto hover:cursor-pointer">
        <Link href={`/smartrotom/${app.url}`}>
              <div className="w-24 h-24 sm:w-36 sm:h-36"><Image src={`/smartrotom/img/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
                <p className="text-white text-center text:2xl lg:text-2xl text-shadow-gray-border2">{app.name}</p>
            </Link>
      </motion.div>
      }
    </li>
  );
}
