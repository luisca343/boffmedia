import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/primitives/button"
import { Home, ArrowLeft } from 'lucide-react'
import { getTranslations } from "next-intl/server"
import "./globals.css"

export default async function NotFound(){
    const t = await getTranslations("common")
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">

            <div className="w-16 h-16 border-4 border-primary-active border-t-transparent rounded-full animate-spin"></div>
        </div>}>
            <div className="flex flex-col items-center justify-center min-h-screen bg-layer-1 text-ink p-4">
                <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-primary-hover to-primary-active text-transparent bg-clip-text">404</h1>
                <p className="text-2xl mb-8 text-ink">{t("notFound.heading")}</p>
                <div className="max-w-md text-center mb-8">
                    <p className="text-ink-muted mb-4">
                        {t("notFound.body")}
                    </p>
                    <p className="text-ink-muted">
                        {t("notFound.cta")}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-primary hover:bg-primary-active text-white">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            {t("notFound.home")}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <Link href="/back">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("notFound.back")}
                        </Link>
                    </Button>
                </div>
            </div>
        </Suspense>
    )
}
