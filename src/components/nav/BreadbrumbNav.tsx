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
        <div className={`${className} flex bg-main-50 rounded-sm h-8 items-center ps-4 text-black`}>
            {parts.map((part, index) => {

                const href = '/' + parts.slice(0, index + 1).join('/')
                return (
                    <React.Fragment key={`breadcrumb-${index}`}>
                        <Breadcrumb index={index} key={index} parts={parts} />
                        <span className="text-3xl font-bold m-1 text-primary">/</span>
                    </React.Fragment>
                )
             }
            )}
        </div>
    )
}



function Breadcrumb({index, parts}: {index: number, parts: string[]}){
    const nombre = rewrite(parts, index)
    const router = useRouter();
    const texto = nombre == 'smartrotom' ? <HomeIcon height={20} width={20} strokeWidth={2.5}/> : nombre

    return (
        <Badge onClick={() => navegar(router, parts, index, isNavigable(nombre))} className="text-sm bg-primary-400 hover:bg-primary-600 hover:cursor-pointer text-black hover:text-main-50  border-black border shadow-sm shadow-black" key={index} >
            {texto}
        </Badge>
    )
}

function isNavigable(nombre: string){
    return !['entrada'].includes(nombre)
}

function rewrite(parts: string[], index: number){
    if(index == 0) return 'smartrotom'
    if(parts[index-1] == 'entrada') {
        const num = parseInt(parts[index])
    }

    return parts[index]
}

function navegar(router: AppRouterInstance, parts: string[], index: number, navigable: boolean){
    if(!navigable) return
    /*if(index == 0) router.push('/smartrotom')
    else {
        const path = '/' + parts.slice(0, index + 1).join('/')
        router.push(path)
    }*/
    const path = getHref('smartrotom', parts.slice(1, index + 1).join('/'))
    router.push(path)
}



function getHref(subdomain: string, url: string) {
    if (window.location.hostname.includes(subdomain)) {
      return `/${url}`;
    } else {
      return `/${subdomain}/${url}`;
    }
  }
  