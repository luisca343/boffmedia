"use client"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { HomeIcon } from '@heroicons/react/24/outline'
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import React from "react";

export default function BreadcrumbNav({className} : {className?: string}){
    const path = usePathname()
    const parts = path.split('/').filter(Boolean)

    return (
        <div className={`${className} flex bg-white rounded-sm h-8 items-center ps-4`}>
            {parts.map((part, index) => {
                const href = '/' + parts.slice(0, index + 1).join('/')
                return (
                    <React.Fragment key={`breadcrumb-${index}`}>
                        <span className="text-3xl font-bold m-1 text-primary">/</span>
                        <Breadcrumb nombre={part} index={index} key={index} />
                    </React.Fragment>
                )
             }
            )}
        </div>
    )
}

function Breadcrumb({nombre, index}: {nombre: string, index: number}){
    const router = useRouter();
    const texto = nombre == 'smartrotom' ? <HomeIcon height={20} width={20} strokeWidth={2.5}/> : nombre

    return (
        <Badge onClick={() => navegar(router, nombre, index)} className="text-sm bg-primary-400 hover:bg-primary-600 hover:cursor-pointer text-black hover:text-white  border-black border shadow-sm shadow-black" key={index} >
            {texto}
        </Badge>
    )
}

function navegar(router: AppRouterInstance, nombre: string, index: number){
    if(nombre == 'smartrotom') router.push('/smartrotom')
    else router.push('/smartrotom/' + nombre)
}
