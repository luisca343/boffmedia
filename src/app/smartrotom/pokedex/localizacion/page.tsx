import { InternalLink } from "@/components/nav/Link"
import { rotomGET } from "@/services/boffAPI"
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export default async function Biomas(){
    const spawnsTranslation  = await getTranslations("");
    const biomes = await rotomGET('/pokemon/biomes') as Record<string, number>
    //<h3>{biome.name} - {biome.amount}</h3>
    return(
    <div className="bg-main-800  flex flex-wrap text-main-100 w-full justify-between p-2">
        {     
        Object.entries(biomes).map(([biome, amount]: [string, number], index: number) => {
            if(biome.includes("biomesoplenty") || biome.includes("terraforged")) return null
            return <InternalLink href={`pokedex/localizacion/${biome}`} key={index}>
                <div className=" flex flex-col p-2 text-center items-center justify-center hover:text-main-800 hover:bg-main-400 w-64 h-32 border rounded-lg my-1">
                    <span>{spawnsTranslation(biome.replace(":","_").replace(" ","_"))}</span>  
                    <span>{amount}</span>
                </div>
            </InternalLink>
})}
        </div>
    )
}