
import {  SkinViewer } from "skinview3d"

const skinCache = new Map<string, string>();
export default async function NpcSkin({npcName, width= 150, height= 150} : {npcName: string, width?: number, height?: number}) {
    if(!skinCache.has(npcName)) {
        console.log("Cache miss")
        const skinViewer = new SkinViewer(
            {
                width: 200,
                height: 400,
                enableControls: false,
            })
        
            skinViewer.width = 200
            skinViewer.height = 200
            skinViewer.camera.setViewOffset(200,400, 0, 0, 200, 200)


            await skinViewer.loadSkin(`https://api.boffmedia.es/smartrotom/img/customNPC/${npcName}.png`)
            skinViewer.render();
            const image = skinViewer.canvas.toDataURL();

            skinCache.set(npcName, image);
        

        skinViewer.dispose();
    }
    if(!skinCache.get(npcName)) return <div style={{width, height, minWidth:width, minHeight:height}}></div>
    return (
        <img width={width} height={height} src={skinCache.get(npcName)} alt={npcName} />
    )
}