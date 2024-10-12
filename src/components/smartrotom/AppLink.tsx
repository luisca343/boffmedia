"use client"
import { App } from "@/types";
import Image from "next/image";
import {motion} from "framer-motion";
import { DndContext, DragEndEvent, closestCenter, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import {MouseSensor, useSensor} from '@dnd-kit/core';
import { rotomPOST } from "@/services/boffAPI";
import { useEffect, useState, useCallback } from "react";
import { InternalLink } from "../nav/Link";
import { useBoffSession } from "@/services/useBoffSession";

export function AppList() {
  const { session, status } = useBoffSession();
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    rotomPOST('/apps/player',{uuid: session?.user?.smartRotomUser?.uuid}).then((res: App[]) => {
      console.log(res);
      setApps(res);
    });
  }, [session?.user?.smartRotomUser?.uuid]);

  if(apps.length === 0) return (<></>)
  return (
    <SortableGrid apps={apps} setApps={setApps} />
  );
}

export function SortableGrid({className, apps, setApps}  : {className?: string, apps: App[], setApps: Function}) {
  const { session } = useBoffSession() 
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
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-between gap-y-1 pb-4 overflow-auto">
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
    isDragging,
    
  } = useSortable({id: app.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let estilos = `w-24 h-24  sm:w-36 sm:h-36 ${isDragging ? 'opacity-50' : ''}`

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="m-auto hover:cursor-pointer mb-2">
      {active ? 
        <motion.div  whileHover={{ scale: 1 }} key={app.id} className=" m-auto hover:cursor-pointer">
          <div className={estilos}><Image src={`/smartrotom/img/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
          <p className="text-main-50 text-center text:2xl lg:text-2xl text-shadow-main-border2">{app.name}</p>
        </motion.div> : 
      <motion.div  whileHover={{ scale: 1.1 }} key={app.id} className=" m-auto hover:cursor-pointer">
        <InternalLink href={app.url}>
          <div className={estilos}><Image src={`/smartrotom/img/apps/${app.url}.webp`} alt={app.name} width={150} height={150}  className="w-full h-full" /></div>
          <p className="text-main-50 text-center text:2xl lg:text-2xl text-shadow-main-border2">{app.name}</p>
        </InternalLink>
      </motion.div>
      }
    </li>
  );
}
