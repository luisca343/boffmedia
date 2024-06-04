"use client"
import { IdleAnimation, NameTagObject, SkinViewer } from "skinview3d"
import { useEffect, useRef, useState } from "react"


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
    const [url, setUrl] = useState('')
    const [isInView, setIsInView] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );
        if (ref.current) {
            observer.observe(ref.current);
        }
        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref]);

    useEffect(() => {
        if (!isInView) return;
        updateNPCImage(npcName)
    }, [props])
    
    if(!isInView) return <div ref={ref} style={{width, height, minWidth:width, minHeight:height}} className={` relative ${className}`}></div>
    if(!url) return <div ref={ref} style={{width, height, minWidth:width, minHeight:height}} className={` relative ${className}`}></div>
    return (
      <div ref={ref}  style={{width, height, minWidth:width, minHeight:height}} className={` relative ${className}`}>
          <img src={url} alt={npcName} className="absolute top-0 left-0 w-full h-full" />
      </div>
      )



      async function updateNPCImage(npcName: string) {
        const canvas = document.createElement('canvas')
        if (!canvas) return
        const skinViewer = new SkinViewer(
            {
                canvas: canvas,
                width: 200,
                height: 400,
                skin: `https://api.boffmedia.es/smartrotom/img/customNPC/${npcName}.png`,
                enableControls: false,
            })
        skinViewer.width = 200
        skinViewer.height = 200
        skinViewer.animation = new IdleAnimation()
        skinViewer.autoRotate = true
        skinViewer.camera.setViewOffset(200,400, 0, 0, 200, 200)
    
        const checkIfLoaded = setInterval(() => {
            const emptyCanvas = document.createElement('canvas')
            emptyCanvas.width = skinViewer.skinCanvas.width
            emptyCanvas.height = skinViewer.skinCanvas.height
            const emptyDataURL = emptyCanvas.toDataURL()
    
            if (skinViewer.skinCanvas.toDataURL() !== emptyDataURL) {
                const url = canvas.toDataURL("image/png")
                skinViewer.dispose();
                canvas.remove()
                clearInterval(checkIfLoaded)
                setUrl(url)
            }
        }, 100)
      }

  }
