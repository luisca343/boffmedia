import { InternalLink } from "@/components/nav/Link"
import { pokemonService } from "@/services/api/smartrotom/pokemonService";
import { getTranslations } from "next-intl/server";

export default async function Biomas(){
    const t  = await getTranslations("pokedex");
    const biomes = await (await pokemonService.getBiomes()).data as Record<string, number>;
    return(
    <div className="bg-surface-800  flex flex-wrap text-surface-100 w-full justify-between p-2">
        {     
        Object.entries(biomes).map(([biome, amount]: [string, number], index: number) => {
            if(biome.includes("biomesoplenty") || biome.includes("terraforged")) return null
            return <InternalLink href={`pokedex/localizacion/${biome}`} key={index}>
                <div className=" flex flex-col p-2 text-center items-center justify-center hover:text-surface-800 hover:bg-surface-400 w-64 h-32 border rounded-lg my-1">
                    <span>{t(biome.replace(":","_").replace(" ","_"))}</span>  
                    <span>{amount}</span>
                </div>
            </InternalLink>
})}
        </div>
    )
}