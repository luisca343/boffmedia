"use client"
import RotomNav from "@/components/nav/RotomNav"
import { RotomNotFound } from "@/components/smartrotom/404"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePathname } from "next/navigation"

export default function NotFound(){
    const pathname = usePathname()
    if (pathname.includes('smartrotom')) return <RotomNotFound />
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-5xl font-bold text-shark-500">404</h1>
            <p className="text-shark-500">Pagina no encontrada.</p>
        </div>
    )
}