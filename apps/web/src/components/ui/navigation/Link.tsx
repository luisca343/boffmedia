"use client"

import { useCallback, useMemo, forwardRef } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { subdomains } from "@/lib/utils"

interface InternalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  app?: string | null
}

export const InternalLink = forwardRef<HTMLAnchorElement, InternalLinkProps>(
  ({ href, children, className, onClick, app = null, ...props }, ref) => {
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
      if (href.startsWith('/')) return href;
      if (app === '') return href;
      if (isSubdomain) return href;
      return `${app || currentApp ? `/${app || currentApp}` : ''}${appendSlash(href)}`;
    }, [href, app, isSubdomain, currentApp]);

    function appendSlash(path: string) {
      if (path[0] === '/') return path
      return `/${path}`
    }

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (onClick) {
        onClick()
      }
      router.push(finalHref)
    }, [onClick, router, finalHref])

    return (
      <Link href={finalHref} {...props} className={className} onClick={handleClick} ref={ref}>
        {children}
      </Link>
    )
  }
)

InternalLink.displayName = 'InternalLink'