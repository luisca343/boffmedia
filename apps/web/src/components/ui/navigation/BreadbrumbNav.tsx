"use client"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/primitives/badge"
import { HomeIcon } from '@heroicons/react/24/outline'
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import React from "react";
import { SmartRotomBadge } from "../../smartrotom/ui/badge";
import { breadcrumbRewrite } from "@/utils/breadcrumb-rewrite";

export default function BreadcrumbNav({className} : {className?: string}){
    const path = usePathname()
    const parts = path.split('/').filter(Boolean)

    return (
        <div className={`${className} flex bg-surface-50 rounded-sm h-8 items-center ps-4 text-black`}>
            {parts.map((part, index) => {

                const href = '/' + parts.slice(0, index + 1).join('/')
                return (
                    <React.Fragment key={`breadcrumb-${index}`}>
                        {index > 0 && <span className="text-3xl font-bold m-1 text-primary">/</span>}
                        <Breadcrumb index={index} key={index} parts={parts} />
                    </React.Fragment>
                )
             }
            )}
        </div>
    )
}

function Breadcrumb({index, parts}: {index: number, parts: string[]}){
    const nombre = breadcrumbRewrite(parts, index)
    const router = useRouter();
    const texto = nombre == 'smartrotom' ? <HomeIcon height={16} width={16} strokeWidth={2}/> : nombre

    if(!nombre) return null
    return (
        <SmartRotomBadge variant="button" onClick={() => navegar(router, parts, index, isNavigable(nombre))}  key={index} >
            {texto}
        </SmartRotomBadge>
    )
}

function isNavigable(nombre: string){
    return !['entrada'].includes(nombre)
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
  