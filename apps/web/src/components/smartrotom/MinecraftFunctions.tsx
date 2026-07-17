import { takeScreenshot } from "@/services/mcef/mcefApi";
import { useRouter } from "next/navigation";
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore";

declare global {
    interface Window {
        openDex: (species:string, form:string) => void;
        takeScreenshot: () => Promise<void>;
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
    const { addScreenshot } = useCameraGalleryStore()
    
    window.openDex = (species: string, form:string) => openDex(species, form);
    window.takeScreenshot = async () => {
        const result = await takeScreenshot({
            includeUI: false,
            format: 'png',
            quality: 90
        });
        if (result.success && result.image) {
            sound('cameraShutter')
            addScreenshot(result.image, result.location, result.entities);
        } else {
            alert('Error taking screenshot: ' + result.error);
        }
    };
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
        <audio id='cameraShutter' src='/smartrotom/audio/apps/camera/camera.mp3'></audio>
    </>
}

