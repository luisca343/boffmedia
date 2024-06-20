
import { Suspense } from "react"



export default function NotFound(){
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-5xl font-bold text-shark-500">404</h1>
                <p className="text-shark-500">Pagina no encontrada.</p>
            </div>
        </Suspense>
    )
}