"use client"
import { usePathname } from "next/navigation"
import { HomeIcon } from 'lucide-react'
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import React from "react";
import { SmartRotomBadge } from "./ui";
import { breadcrumbRewrite } from "@/utils/breadcrumb-rewrite";

export default function BreadcrumbNav({className} : {className?: string}){
    const path = usePathname()
    const parts = path.split('/').filter(Boolean)

    return (
        <div className={`${className} flex cut cut-edge-slant [--cut:6px] [--cut-line:var(--sr-line)] bg-sr-panel-2 border border-sr-line h-8 items-center px-3 text-sr-txt`}>
            {parts.map((part, index) => {

                const href = '/' + parts.slice(0, index + 1).join('/')
                return (
                    <React.Fragment key={`breadcrumb-${index}`}>
                        {index > 0 && <span className="text-lg font-display m-1 text-sr-accent">/</span>}
                        <Breadcrumb index={index} key={index} parts={parts} />
                    </React.Fragment>
                )
             }
            )}
        </div>
    )
}

function Breadcrumb({index, parts}: {index: number, parts: string[]}){
    const label = breadcrumbRewrite(parts, index)
    const router = useRouter();
    const text = label == 'smartrotom' ? <HomeIcon height={16} width={16} strokeWidth={2}/> : label

    if(!label) return null
    return (
        <SmartRotomBadge variant="button" onClick={() => navigate(router, parts, index, isNavigable(label))}  key={index} >
            {text}
        </SmartRotomBadge>
    )
}

function isNavigable(label: string){
    return !['entrada'].includes(label)
}

function navigate(router: AppRouterInstance, parts: string[], index: number, navigable: boolean){
    if(!navigable) return
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
