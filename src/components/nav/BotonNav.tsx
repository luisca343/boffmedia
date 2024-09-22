"use client"
import { RefreshCcw, BellRing, ChevronLeft, ChevronRight, Settings, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

export function BotonNav({Icono, strokeWidth = 4, onClick = null, label} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>, label: string}){
    return (
        <button aria-label={label} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-main-50" onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={28} width={28} className="text-primary-400 group-hover:text-primary-600"/>
        </button>
    )
}

export function BotonPrev(){
    const router = useRouter();
    return <BotonNav Icono={ChevronLeft} label="Previous" onClick={() => router.back()}/>
}

export function BotonNext(){
    const router = useRouter();
    return <BotonNav Icono={ChevronRight} label="Next" onClick={() => router.forward()}/>
}

export function BotonReload(){
    const router = useRouter();
    return <BotonNav Icono={RefreshCcw} label="Reload" strokeWidth={3} onClick={() => router.refresh()}/>
}

export function BotonNotification(){
    return <span aria-label={"Notificaciones"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-main-50">
        <BellRing strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}

export function BotonAjustes(){
    return <span aria-label={"Ajustes"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-main-50">
        <Settings strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}

export function BotonIA(){
    return <span aria-label={"IA"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-main-50">
        <Cpu strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}