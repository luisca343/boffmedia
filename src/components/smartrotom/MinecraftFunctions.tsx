import { useRouter } from "next/navigation";

declare global {
    interface Window {
        openDex: (species:string, form:string) => void;
        refresh: () => void;
    }
}


export function MinecraftFunctions(){
    const router = useRouter()
    window.openDex = (pokemon: string, form:string) => openDex(pokemon, form);
    window.refresh = refresh;


    function refresh() {
        alert("refresh")
    }
    
    function openDex(species: string, form: string) {
       router.push(`/smartrotom/pokedex/entrada/${species}/${form}`)
    }
    

    return <></>
}

