
"use client"

import { Loading } from "@/components/smartrotom/Loading";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";
import { getItemSprite, getPokemonImage, getPokemonSprite } from "../dexUtils";
import { useSession } from "next-auth/react";
import { getSmartRotomUser } from "@/lib/utils";
/*
export function PokemonSpriteOld ({name, dex, form, shiny=false, width=100, height=100}: {name:string, dex:number, form: string, shiny?: boolean, width?: number, height?: number}){
    const [imageUrl, setImageUrl] = useState(getPokemonSprite(name, form, shiny));
    const [loaded, setLoaded] = useState(false)
    const [fallback, setFallback] = useState(false)
  

    useEffect(() => {
        const image = new Image();
        image.src = imageUrl;
        image.onerror = () => setImageUrl(getFallbackSprite(name));
        image.onload = () => setLoaded(true);
      }, [imageUrl]);


    function getPokemonSprite(name: string, form: string, shiny: boolean){
        const formString = form && form != 'base' ? `_${form.toUpperCase()}` : ''
        const folderString = shiny ? 'Front Shiny' : 'Front'
        return `/smartrotom/img/sprites/${folderString}/${name.toUpperCase()}${formString}.png`
    }

    let numStr = dex.toString().padStart(3, '0')
    if(!form) form = 'base'

    function getFallbackSprite(name: string){
        setFallback(true)
        return `/smartrotom/packs/resourcepack/assets/pixelmon/textures/pokemon/${numStr}_${name.toLowerCase()}/all/${form}/none/sprite.png`
    }
    
    if(!loaded) return <Loading width={width} height={height}/>
    return <img className={fallback ? 'mb-2 mt-[-0.5rem]' : ''} width={width || 100} height={height || 100} src={imageUrl} alt={name} style={{imageRendering:'pixelated'}}/>;
}





export function PokemonMiniSprite ({name, dex, form, palette='none', width=100, height=100, gender='all'}: {name:string, dex:number, form: string, palette?: string, width?: number, height?: number, gender?: string}){
    const [imageUrl, setImageUrl] = useState(getPokemonSprite(name, form, palette));
    const [loaded, setLoaded] = useState(false)
    const [fallback, setFallback] = useState(false)

  
    function getNumStr(dex: number){
        let numStr = dex.toString().padStart(3, '0')
        if(!form) form = 'base'
        return numStr
    }

    useEffect(() => {
        const image = new Image();
        image.src = imageUrl;
        image.onerror = () => setImageUrl(getFallbackSprite(name));
        image.onload = () => setLoaded(true);
      }, [imageUrl]);


    function getPokemonSprite(name: string, form: string, palette: string){
        const formString = form && form != 'base' ? `_${form.toUpperCase()}` : ''
        const folderString = palette === 'shiny' ? 'Front Shiny' : 'Front'
        return `/smartrotom/packs/resourcepack/assets/pixelmon/textures/pokemon/${getNumStr(dex)}_${name.toLowerCase()}/${gender}/${form}/${palette}/sprite.png`
    }


    function getFallbackSprite(name: string){
        setFallback(true)
        return `/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/${getNumStr(dex)}_${name.toLowerCase()}/${gender}/${form}/${palette}/sprite.png`
    }
    
    if(!loaded)  return <Loading width={width} height={height}/>
    return <img className={fallback ? 'mb-2 mt-[-0.5rem]' : ''} width={width || 100} height={height || 100} src={imageUrl} alt={name} style={{imageRendering:'pixelated'}}/>;
}


export function PokemonSpriteWithURL ({url, width, height}: {url:string, width?: number, height?: number}) {
    const [imageUrl, setImageUrl] = useState(`/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/${url}`);
    const [loaded, setLoaded] = useState(false)
    const [fallback, setFallback] = useState(false)

  


    useEffect(() => {
        const image = new Image();
        image.src = imageUrl;
        image.onerror = () => setImageUrl(getFallbackSprite());
        image.onload = () => setLoaded(true);
      }, [imageUrl]);

    function getFallbackSprite(){
        setFallback(true)
        return `/smartrotom/packs/resourcepack/assets/pixelmon/textures/${url}`
    }
    
    if(!loaded)  return <Loading width={width} height={height}/>
    return <img className={fallback ? 'mb-2 mt-[-0.5rem]' : ''} width={width || 100} height={height || 100} src={imageUrl} alt={url} style={{imageRendering:'pixelated'}}/>;
}*/



export function PokemonSprite({id, form, palette, width=100, height=100, pixelated = true, hide=true}: {id:number, form: string, palette: string, width?: number, height?: number, pixelated?: boolean, hide?: boolean}) {
    console.log(id, form, palette, pixelated)
    const [imageUrl, setImageUrl] = useState() as any;
    const [loaded, setLoaded] = useState(false)
    const {data: session} = useSession()  as any


    useEffect(() => {
        if(pixelated) {
            getPokemonSprite(id, form, palette, getSmartRotomUser(session).uuid, hide).then((img) => {
                    setImageUrl(img)
                    setLoaded(true)
                }
            )
        } else {
            getPokemonImage(id, form, palette, getSmartRotomUser(session).uuid, hide).then((img) => {
                    setImageUrl(img)
                    setLoaded(true)
                }
            )
        }
      }, []);

    if(!loaded) return <Loading width={width} height={height}/>
    return <img width={width} height={height} src={imageUrl?.url} alt="pokemon" style={{imageRendering:'pixelated'}} 
        className={`${imageUrl?.type === 'sprite' ? 'mb-2 mt-[-0.5rem]' : ''} ${imageUrl.status === 1 ? '' : 'brightness-0'}`}/>
}


export function ItemSprite({name, width=100, height=100}: {name:string, width?: number, height?: number}) {
    const [imageUrl, setImageUrl] = useState() as any;
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        console.log('getting item sprite')
        getItemSprite(name).then((img) => {
                setImageUrl(img)
                setLoaded(true)
            }
        )
      }, []);

    if(!loaded) return <Loading width={width} height={height}/>
    return <img width={width} height={height} src={imageUrl?.url} alt="item" style={{imageRendering:'pixelated'}}/>
}