
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import {  SkinViewer } from "skinview3d"

const skinCache = new Map<string, string>();
export default async function NpcSkin({npcName, width= 150, height= 150} : {npcName: string, width?: number, height?: number}) {
    let skin = await rotomGET(`/img/customNPC/render/${npcName}`)
    console.log("BUSCANDO RENDER PARA " +npcName + ":", skin)
    
    if(skin.error) {
        console.log("Cache miss")
        const skinViewer = new SkinViewer(
            {
                width: 200,
                height: 400,
                enableControls: false,
            })
        
            
            //skinViewer.width = 200
            //skinViewer.height = 200
            //skinViewer.camera.setViewOffset(200,400, 0, 0, 200, 200)
            
            skinViewer.camera.rotation.x = -0.620;
            skinViewer.camera.rotation.y = 0.534;
            skinViewer.camera.rotation.z = 0.348;
            skinViewer.camera.position.x = -30.5;
            skinViewer.camera.position.y = 22.0;
            skinViewer.camera.position.z = 42.0;
            

            let skin = await rotomGET(`/img/customNPC/${npcName}`)
            console.log("SE GA DETECTADO LA SKIN", skin)
            if(skin.error) {
            await skinViewer.loadSkin(`/smartrotom/img/customNPC/steve.png`)
            } else {
                await skinViewer.loadSkin(`/smartrotom/img/customNPC/${npcName}.png`)
            }

            skinViewer.render();
            const image = skinViewer.canvas.toDataURL();

            skinCache.set(npcName, image);
            skin  = {img: image}
            
            rotomPOST('/img/customNPC', {npcName, image})
        

        skinViewer.dispose();
    }
   
    if(skin.error) return <div style={{width, height, minWidth:width, minHeight:height}}></div>
    return (
        <img width={width} height={height} src={`/smartrotom/img/customNPC/renders/${npcName}.png`} alt={npcName} />
    )
}