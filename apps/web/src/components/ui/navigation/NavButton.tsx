"use client"
import { RefreshCcw, BellRing, ChevronLeft, ChevronRight, Settings, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

const chrome =
    "rounded-none h-8 w-8 mx-0.5 flex items-center justify-center group transition-colors hover:bg-sr-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sr-accent";
const glyph = "text-sr-txt-muted transition-colors group-hover:text-sr-accent-bright";

export function NavButton({Icono, strokeWidth = 2.25, onClick = null, label} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>, label: string}){
    return (
        <button aria-label={label} className={chrome} onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={22} width={22} className={glyph}/>
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
    return <NavButton Icono={RefreshCcw} label="Reload" strokeWidth={2} onClick={() => router.refresh()}/>
}

export function NotificationButton(){
    return <span aria-label={"Notifications"} className={chrome}>
        <BellRing strokeWidth={2} height={20} width={20} className={glyph}/>
    </span>
}

export function SettingsButton(){
    return <span aria-label={"Settings"} className={chrome}>
        <Settings strokeWidth={2} height={20} width={20} className={glyph}/>
    </span>
}

export function AIButton(){
    return <span aria-label={"AI"} className={chrome}>
        <Cpu strokeWidth={2} height={20} width={20} className={glyph}/>
    </span>
}
