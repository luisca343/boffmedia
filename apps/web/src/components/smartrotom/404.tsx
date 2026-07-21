import { RotomNav } from "./RotomNav"
import { GlobalProviders } from "@/app/GlobalProviders"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { useTranslations } from "next-intl"

export function RotomNotFoundFull(){ 
    return (
        <main className={`roboto flex flex-col h-screen overflow-hidden  bg-primary-hover bg-center bg-no-repeat bg-cover bg-fixed`}>
            <GlobalProviders>
                <TooltipProvider>
                <RotomNav />
                   <RotomNotFound/>
                </TooltipProvider>
            </GlobalProviders>
        </main>
    )
}

export function RotomNotFound(){
    const t = useTranslations("smartrotom.notFound")
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-primary-hover">
            <h1 className="text-5xl font-bold text-black">{t("title")}</h1>
            <p className="text-b">{t("message")}</p>
        </div>
    )
}
