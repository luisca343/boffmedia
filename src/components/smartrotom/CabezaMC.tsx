"use client"
import { IdleAnimation, NameTagObject, SkinViewer } from "skinview3d"
import { useEffect } from "react"


export function CabezaJugador({uuid, nombreNPC, autoRotate = true, tag = false, zoom = 1, ...props} : {uuid: string, nombreNPC: string, autoRotate?: boolean, tag?: boolean, zoom?: number}){
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
        skinViewer.width = 150
        skinViewer.height = 150
        skinViewer.animation = new IdleAnimation()
        skinViewer.autoRotate = autoRotate
        skinViewer.camera.setViewOffset(200,400, 25, 0, 150, 150)
        if(tag) 
          skinViewer.nameTag = new NameTagObject(nombreNPC, { textStyle: 'white' }) 
    }, [props])
  
    return (
      <div style={{width:150, height:150}}>
          <canvas id="skin_container" />
      </div>
      )
  }