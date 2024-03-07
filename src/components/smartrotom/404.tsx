import { TooltipProvider } from "@radix-ui/react-tooltip"
import RotomNav from "../nav/RotomNav"
import { GlobalProviders } from "@/app/GlobalProviders"

export function RotomNotFound(){ 
    return (
        <main className={`roboto flex flex-col h-screen overflow-hidden  bg-rotom bg-center bg-no-repeat bg-cover bg-fixed`}>
            <GlobalProviders>
                <TooltipProvider>
                <RotomNav />
                    <div className="flex flex-col items-center justify-center overflow-auto border-solid no-scrollbar flex-1">
                        <h1 className="text-5xl font-bold text-black">404</h1>
                        <p className="text-b">Pagina no encontrada.</p>
                    </div>
                </TooltipProvider>
            </GlobalProviders>
        </main>
    )
}