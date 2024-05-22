import { useRouter } from "next/navigation";

declare global {
    interface Window {
        openDex: (species:string, form:string) => void;
        refresh: () => void;
    }
}

function sound(name: string) {
    const audio = document.getElementById(name)?.cloneNode() as HTMLAudioElement;
    if (audio) {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        } else {
            audio.play();
        }
    }
}


export function MinecraftFunctions(){
    const router = useRouter()
    window.openDex = (species: string, form:string) => openDex(species, form);
    window.refresh = () => refresh();


    function refresh() {
        alert("refresh")
    }
    
    async function openDex(species: string, form: string) {
        sound('dexOpen')
        router.push(`/smartrotom/pokedex/registro/${species}/${form}`)
    }
    

    return <>
        <audio id='dexOpen' src='/smartrotom/audio/apps/pokedex/openDex.mp3'></audio>
    </>
}

