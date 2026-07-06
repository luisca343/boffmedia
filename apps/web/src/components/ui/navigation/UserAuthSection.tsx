'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useBoffSession } from '@/services/useBoffSession'
import { Icon } from '@/components/boffmedia-v2/primitives/icon'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/primitives/avatar'

export default function UserAuthSection() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useBoffSession()
  const t = useTranslations('nav.auth')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const active = (href: string) =>
    (pathname.startsWith(href) && href !== '/') || pathname === href

  // ── Logged in: navuser pill + logout icon button ──
  if (session) {
    const initial = (session.user.name || session.user.smartRotomUser?.username || 'U')
      .charAt(0).toUpperCase()

    return (
      <>
        <Link
          href="/perfil"
          className={
            'inline-flex items-center gap-[0.55rem] py-[0.3rem] pr-[0.75rem] pl-[0.35rem] border-solid bg-layer-2 rounded-[var(--radius-pill)] transition-[border-color] duration-[var(--dur)] ' +
            (active('/perfil')
              ? 'border-[var(--orange-500)]'
              : 'border-edge-strong hover:border-[var(--orange-500)]')
          }
          style={{ borderWidth: 'var(--hairline)' }}
        >
          <Avatar className="w-[30px] h-[30px]">
            <AvatarImage
              src={session.user.image || undefined}
              alt={session.user.name || ''}
              className="object-cover"
            />
            <AvatarFallback
              className="font-display font-extrabold text-[0.85rem] text-white"
              style={{
                background: 'linear-gradient(135deg, var(--orange-500), var(--orange-700))',
              }}
            >
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-[length:var(--t-sm)] font-semibold text-ink">
            {session.user.name || session.user.smartRotomUser?.username || 'User'}
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          aria-label={t('logout')}
          className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] border border-transparent bg-transparent text-ink-muted hover:text-ink hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] cursor-pointer transition-colors duration-[var(--dur)]"
        >
          <Icon name="arrow" size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </>
    )
  }

  // ── Logged out: login + register icon buttons ──
  return (
    <>
      <button
        onClick={() => router.push('/api/auth/signin')}
        aria-label={t('login')}
        className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] border border-transparent bg-transparent text-ink-muted hover:text-ink hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] cursor-pointer transition-colors duration-[var(--dur)]"
      >
        <Icon name="user" size={18} />
      </button>
      <button
        onClick={() => router.push('/auth?mode=register')}
        aria-label={t('register')}
        className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] border border-edge-strong bg-transparent text-ink-muted hover:text-[var(--orange-500)] hover:border-[var(--orange-500)] cursor-pointer transition-colors duration-[var(--dur)]"
      >
        <Icon name="plus" size={18} />
      </button>
    </>
  )
}
