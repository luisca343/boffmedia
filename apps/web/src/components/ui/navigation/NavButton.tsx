"use client"
import { RefreshCcw, BellRing, ChevronLeft, ChevronRight, Settings, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavButton({Icono, strokeWidth = 4, onClick = null, label} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>, label: string}){
    return (
        <button aria-label={label} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-surface-50" onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={28} width={28} className="text-primary-400 group-hover:text-primary-600"/>
        </button>
    )
}

export function PrevButton(){
    const router = useRouter();
    return <NavButton Icono={ChevronLeft} label="Previous" onClick={() => router.back()}/>
}

export function NextButton(){
    const router = useRouter();
    return <NavButton Icono={ChevronRight} label="Next" onClick={() => router.forward()}/>
}

export function ReloadButton(){
    const router = useRouter();
    return <NavButton Icono={RefreshCcw} label="Reload" strokeWidth={3} onClick={() => router.refresh()}/>
}

export function NotificationButton(){
    return <span aria-label={"Notifications"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-surface-50">
        <BellRing strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}

export function SettingsButton(){
    return <span aria-label={"Settings"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-surface-50">
        <Settings strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}

export function AIButton(){
    return <span aria-label={"AI"} className="rounded-lg border-0 h-8 w-8 mx-1 flex items-center justify-center group hover:bg-surface-50">
        <Cpu strokeWidth={2} height={24} width={24} className="text-primary-400 group-hover:text-primary-600"/>
    </span>
}
