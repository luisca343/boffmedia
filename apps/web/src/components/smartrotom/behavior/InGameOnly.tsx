'use client'

import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMinecraft } from './useIsMinecraft'
import { SmartRotomPanel } from '../ui'

export interface InGameOnlyProps {
  /** The component to render only in-game. */
  children: ReactNode
  /** Optional fallback message key override (default: 'minecraft.onlyInGame'). */
  messageKey?: string
  /** If true, renders null outside Minecraft instead of showing a message. */
  silent?: boolean
}

/**
 * Gate for surfaces that require Minecraft (MCEF).
 *
 * Outside Minecraft, displays a consistent message explaining the requirement.
 * Inside Minecraft, renders children normally.
 *
 * Use for surfaces that genuinely cannot work outside the game (camera, claiming items, etc).
 * For surfaces that can degrade, manage the detection yourself and fallback gracefully.
 */
export function InGameOnly({ children, messageKey = 'minecraft.onlyInGame', silent }: InGameOnlyProps) {
  const t = useTranslations('smartrotom')
  const inMinecraft = useIsMinecraft()

  if (inMinecraft) {
    return children
  }

  if (silent) {
    return null
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <SmartRotomPanel className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="text-5xl">⛓️</div>
        <h2 className="font-display text-lg font-bold text-sr-txt">{t('minecraft.needsGame')}</h2>
        <p className="text-sm text-sr-txt-muted">{t(messageKey)}</p>
        <p className="text-xs text-sr-txt-muted/60">
          {t('minecraft.openInGame')}
        </p>
      </SmartRotomPanel>
    </div>
  )
}
