"use client"
import { IdleAnimation, NameTagObject, SkinViewer } from "skinview3d"
import { useEffect } from "react"


export function CabezaJugador({uuid, nombreNPC, autoRotate = true, tag = false, zoom = 1, width= 150, height= 150, className='', ...props} : {uuid: string, nombreNPC: string, autoRotate?: boolean, tag?: boolean, zoom?: number, width?: number, height?: number, className?: string}) {
    useEffect(() => {
        const canvas = document.getElementById(`skin_container_${uuid}`) as HTMLCanvasElement
        if (!canvas) return
        const skinViewer = new SkinViewer(
            {
                canvas: canvas,
                width: 200,
                height: 400,
                skin: `https://crafatar.com/skins/${uuid}`,
                enableControls: false
                
            })
        skinViewer.width = width
        skinViewer.height = height
        skinViewer.animation = new IdleAnimation()
        skinViewer.autoRotate = autoRotate
        skinViewer.camera.setViewOffset(200,400, 25, 0, 150, 150)
        if(tag) 
          skinViewer.nameTag = new NameTagObject(nombreNPC, { textStyle: 'white' }) 
    }, [props])
  
    return (
      <div style={{width, height}} className={className}>
          <canvas id={`skin_container_${uuid}`} />
      </div>
      )
  }

  export function NPCHead({npcName, autoRotate = true, tag = false, zoom = 1, width= 150, height= 150, className='', ...props} : {npcName: string, autoRotate?: boolean, tag?: boolean, zoom?: number, width?: number, height?: number, className?: string}) {
    const randomId = Math.random().toString(36).substring(7)
    useEffect(() => {
        const canvas = document.getElementById(`skin_container_${randomId}`) as HTMLCanvasElement
        if (!canvas) return
        const skinViewer = new SkinViewer(
            {
                canvas: canvas,
                width: 200,
                height: 400,
                skin: `https://api.boffmedia.es/smartrotom/img/customNPC/${npcName}.png`,
                enableControls: false
                
            })
        skinViewer.width = width
        skinViewer.height = height
        skinViewer.animation = new IdleAnimation()
        skinViewer.autoRotate = autoRotate
        skinViewer.camera.setViewOffset(200,400, 25, 0, 150, 150)
        if(tag) 
          skinViewer.nameTag = new NameTagObject(npcName, { textStyle: 'white' }) 
    }, [props])
  
    return (
      <div style={{width, height, minWidth:width, minHeight:height}} className={` relative ${className}`}>
          <canvas id={`skin_container_${randomId}`} />
      </div>
      )
  }