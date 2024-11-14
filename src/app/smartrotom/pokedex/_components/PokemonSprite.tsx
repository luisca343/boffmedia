
"use client"

import { Loading } from "@/components/smartrotom/Loading";
import { useEffect, useState } from "react";
import {  getItemSprite, getPokemonImage, getPokemonSprite } from "../dexUtils";
import { getSmartRotomUser } from "@/lib/utils";
import {  StatusIconv2 } from "./StatusIcon";
import { InternalLink } from "@/components/nav/Link";
import { useBoffSession } from "@/services/useBoffSession";



export function PokemonSpriteLink({children, id, form, palette, width=80, height=80, pixelated = true, hide=false, showStatus= true, link=true, hideCaught= false, hideSeen= false}:
    {text:string, id:number, form: string, palette: string, width?: number, height?: number, pixelated?: boolean, hide?: boolean, showStatus?: boolean, link?: boolean, children?: any, hideCaught?: boolean, hideSeen?: boolean}) {
        const [imageUrl, setImageUrl] = useState() as any;
        const [loaded, setLoaded] = useState(false)
        const { session } = useBoffSession();
    
    
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
        if(hideCaught && imageUrl.status === 2) return null
        if(hideSeen && imageUrl.status === 1) return null
        
        return <InternalLink  className="flex flex-col items-center  hover:bg-foreground  rounded-sm text-center w-24 2xl:w-20   text-text-primary" href={`/pokedex/entrada/${id}`}>
            <div style={{width, maxHeight:height}} className={` relative ${imageUrl?.type === 'sprite' ? 'mb-2 mt-[-0.5rem]' : ''}`}><img width={width} height={height} src={imageUrl?.url} alt="pokemon" style={{imageRendering:'pixelated'}} 
              className={` ${imageUrl.showImg ? '' : 'brightness-0'}`}/>
                 {showStatus && 
                 <div className="absolute top-1 right-1">
                      <StatusIconv2 status={imageUrl.status}  palette={palette} width={width} height={height}/>
                 </div>}
              </div>
            {children && <div className="text-xs hidden 2xl:block">{children}</div>}
        </InternalLink>
}

export function PokemonSprite({id, form, palette, width=100, height=100, pixelated = true, hide=true, showStatus= true, forceBlack=false}: 
    {id:number, form: string, palette: string, width?: number, height?: number, pixelated?: boolean, hide?: boolean, showStatus?: boolean, forceBlack?: boolean}) {
    const [imageUrl, setImageUrl] = useState() as any;
    const [loaded, setLoaded] = useState(false)
    const { session } = useBoffSession();


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
    return <div style={{width, maxHeight:height}} className={` relative ${imageUrl?.type === 'sprite' ? 'mb-2 mt-[-0.5rem]' : ''}`}><img width={width} height={height} src={imageUrl?.url} alt="pokemon" style={{imageRendering:'pixelated'}} 
        className={` ${imageUrl.showImg && !forceBlack ? '' : 'brightness-0'}`}/>
           {showStatus && 
           <div className="absolute top-1 right-1">
                <StatusIconv2 status={imageUrl.status}  palette={palette} width={width} height={height}/>
           </div>}
        </div>
}


export function ItemSprite({name, width=100, height=100}: {name:string, width?: number, height?: number}) {
    const [imageUrl, setImageUrl] = useState() as any;
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        getItemSprite(name).then((img) => {
                setImageUrl(img)
                setLoaded(true)
            }
        )
      }, []);

    if(!loaded) return <Loading width={width} height={height}/>
    return <img width={width} height={height} src={imageUrl?.url} alt="item" style={{imageRendering:'pixelated'}}/>
}

