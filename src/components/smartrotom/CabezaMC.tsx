"use client"
import { IdleAnimation, NameTagObject, SkinViewer } from "skinview3d"
import { useEffect } from "react"


export function CabezaJugador({uuid, nombreNPC, autoRotate = true, tag = false, zoom = 1, width= 150, height= 150, ...props} : {uuid: string, nombreNPC: string, autoRotate?: boolean, tag?: boolean, zoom?: number, width?: number, height?: number}) {
    useEffect(() => {
        const canvas = document.getElementById('skin_container') as HTMLCanvasElement
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
      <div style={{width, height}}>
          <canvas id="skin_container" />
      </div>
      )
  }