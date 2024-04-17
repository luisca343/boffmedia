
"use client"

import { Pokemon } from "@/types/Pokemon";
import { useEffect, useState } from "react";

export function PokemonSprite ({name, dex, form, shiny, width, height}: {name:string, dex:number, form: string, shiny: boolean, width?: number, height?: number}){
    const [imageUrl, setImageUrl] = useState(getPokemonSprite(name, form, shiny));
  

    useEffect(() => {
        const image = new Image();
        image.src = imageUrl;
        image.onerror = () => setImageUrl(getFallbackSprite(name));
      }, [imageUrl]);


    function getPokemonSprite(name: string, form: string, shiny: boolean){
        const formString = form && form != 'base' ? `_${form.toUpperCase()}` : ''
        const folderString = shiny ? 'Front Shiny' : 'Front'
        return `/smartrotom/img/sprites/${folderString}/${name.toUpperCase()}${formString}.png`
    }

    let numStr = dex.toString().padStart(3, '0')
    if(!form) form = 'base'

    function getFallbackSprite(name: string){
        return `/smartrotom/packs/resourcepack/assets/pixelmon/textures/pokemon/${numStr}_${name.toLowerCase()}/all/${form}/none/sprite.png`
    }
    
    return <img width={width || 100} height={height || 100} src={imageUrl} alt={name} style={{imageRendering:'pixelated'}}/>;
}