"use client"

import { useCallback, useMemo } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { subdomains } from "@/lib/utils"

interface InternalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  app?: string | null
}

export function InternalLink({ href, children, className, onClick, app = null, ...props }: InternalLinkProps) {
  const router = useRouter()

  const subdomain = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.host.split('.')[0]
    }
    return ''
  }, [])

  const currentApp = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.split('/')[1] || ''
    }
    return ''
  }, [])

  const isSubdomain = useMemo(() => subdomains.includes(subdomain), [subdomain])

  const finalHref = useMemo(() => {
    if (app === '') return href
    if (isSubdomain) return href
    return `${app || currentApp ? `/${app || currentApp}` : ''}${href}`
  }, [href, app, isSubdomain, currentApp])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (onClick) {
      onClick()
    }
    router.push(finalHref)
  }, [onClick, router, finalHref])

  return (
    <Link href={finalHref} {...props} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}

