
"use client"

import { Loading } from "@/components/smartrotom/Loading";
import { useEffect, useState } from "react";
import {  getDisplayName, getDisplayPokemonName, getItemSprite, getPokemonImage, getPokemonSprite } from "../dexUtils";
import {  StatusIconv2 } from "./StatusIcon";
import { InternalLink } from "@/components/nav/Link";
import { usePokemonStore } from "@/stores/pokemonStore";
import { useTranslations } from "next-intl";



export function PokemonSpriteLink({name, children, id, form, palette, width=80, height=80, pixelated = true, hide=false, showStatus= true, link=true, hideCaught= false, hideSeen= false}:
    {name: string, id:number, form: string, palette: string, width?: number, height?: number, pixelated?: boolean, hide?: boolean, showStatus?: boolean, link?: boolean, children?: any, hideCaught?: boolean, hideSeen?: boolean}) {
        const [imageUrl, setImageUrl] = useState() as any;
        const {pokedexData} = usePokemonStore()
        const trans  = useTranslations("");

        useEffect(() => {
            if(!pokedexData) return
            if(pixelated) {
                getPokemonSprite(id, form, palette, hide, pokedexData).then((img) => {
                        setImageUrl(img)
                    }
                )
            } else {
                getPokemonImage(id, form, palette, hide, pokedexData).then((img) => {
                        setImageUrl(img)
                    }
                )
            }
          }, [pokedexData]);


        if(!imageUrl || !pokedexData) return <Loading width={width} height={height}/>
        if(hideCaught && imageUrl.status === 2) return null
        if(hideSeen && imageUrl.status === 1) return null
        
        return <InternalLink  className="flex flex-col items-center  hover:bg-surface-400  rounded-sm text-center w-24 2xl:w-20   text-surface-50" href={`/pokedex/entrada/${id}`}>
            <div style={{width, maxHeight:height}} className={` relative ${imageUrl?.type === 'sprite' ? 'mb-2 mt-[-0.5rem]' : ''}`}><img width={width} height={height} src={imageUrl?.url} alt="pokemon" style={{imageRendering:'pixelated'}} 
              className={` ${imageUrl.showImg ? '' : 'brightness-0'}`}/>
                 {showStatus && 
                 <div className="absolute top-1 right-1">
                      <StatusIconv2 status={imageUrl.status}  palette={palette} width={width} height={height}/>
                 </div>}
              </div>
              
            <div className="text-xs hidden 2xl:block">
                {getDisplayName(name, id, form, palette, hide, trans, pokedexData)}
            </div>
            {children && <div className="text-xs hidden 2xl:block">{children}</div>}
        </InternalLink>
}

export function PokemonName({id, form, palette, name, hide=true}: 
    {id:number, form: string, palette: string, name: string, hide?: boolean }) {
        const {pokedexData} = usePokemonStore()

        if(!pokedexData) return null

    return <span>{getDisplayPokemonName(id, form, name, hide, pokedexData)}</span>

}
    


export function PokemonSprite({id, form, palette, width=100, height=100, pixelated = true, hide=true, showStatus= true, forceBlack=false}: 
    {id:number, form: string, palette: string, width?: number, height?: number, pixelated?: boolean, hide?: boolean, showStatus?: boolean, forceBlack?: boolean}) {
    const [imageUrl, setImageUrl] = useState() as any;
    const {pokedexData} = usePokemonStore()


    useEffect(() => {
        if(!pokedexData) return
        if(pixelated) {
            getPokemonSprite(id, form, palette, hide, pokedexData).then((img) => {
                    setImageUrl(img)
                }
            )
        } else {
            getPokemonImage(id, form, palette, hide, pokedexData).then((img) => {
                    setImageUrl(img)
                }
            )
        }
      }, [pokedexData]);

    if(!imageUrl || !pokedexData) return <Loading width={width} height={height}/>
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

