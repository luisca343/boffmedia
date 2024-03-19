"use client"
import { ArrowPathIcon, BellAlertIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export function BotonNav({Icono, strokeWidth = 4, onClick = null, label} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>, label: string}){
    return (
        <button aria-label={label} className="rounded-lg border-0 h-8 w-8 mx-1 bg-white flex items-center justify-center group" onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={28} width={28} className="text-rotom-500 group-hover:text-rotom-800"/>
        </button>
    )
}

export function BotonPrev(){
    const router = useRouter();
    return <BotonNav Icono={ChevronLeftIcon} label="Previous" onClick={() => router.back()}/>
}

export function BotonNext(){
    const router = useRouter();
    return <BotonNav Icono={ChevronRightIcon} label="Next" onClick={() => router.forward()}/>
}

export function BotonReload(){
    const router = useRouter();
    return <BotonNav Icono={ArrowPathIcon} label="Reload" strokeWidth={3} onClick={() => router.refresh()}/>
}

export function BotonNotification(){
    return <BotonNav Icono={BellAlertIcon} label="Notifications" strokeWidth={3} />
}

export function BotonAjustes(){
    return <span aria-label={"Ajustes"} className="rounded-lg border-0 h-8 w-8 mx-1 bg-white flex items-center justify-center group">
        <Cog6ToothIcon strokeWidth={3} height={28} width={28} className="text-rotom-500 group-hover:text-rotom-800"/>
    </span>
}

export function BotonIA(){
    return <span aria-label={"IA"} className="rounded-lg border-0 h-8 w-8 mx-1 bg-white flex items-center justify-center group">
        <CpuChipIcon strokeWidth={2} height={28} width={28} className="text-rotom-500 group-hover:text-rotom-800"/>
    </span>
}