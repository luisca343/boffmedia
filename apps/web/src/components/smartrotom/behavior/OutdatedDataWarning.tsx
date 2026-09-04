'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMinecraft } from './useIsMinecraft'

export interface OutdatedDataWarningProps {
  /** Keys resolved against the `smartrotom` namespace. */
  messageKey?: string
  descriptionKey?: string
  /** Already-translated text, for callers whose strings live in another
   *  namespace (chatapp, pokedex). Takes precedence over the key props — the
   *  alternative was each of those surfaces hand-rolling the same banner,
   *  which is the inconsistency this whole finding is about. */
  message?: string
  description?: string
  className?: string
}

/**
 * Shows a consistent warning banner when data may be outdated outside Minecraft.
 *
 * Used for surfaces that have degraded functionality outside the game (empty lists,
 * stale data, placeholder values) but continue to render.
 *
 * Keys should exist in the caller's locale file under the appropriate section.
 * By default looks for minecraft.outdated and minecraft.outdatedDesc in smartrotom.
 */
export function OutdatedDataWarning({
  messageKey = 'minecraft.outdated',
  descriptionKey = 'minecraft.outdatedDesc',
  message,
  description,
  className,
}: OutdatedDataWarningProps) {
  const t = useTranslations('smartrotom')
  const inMinecraft = useIsMinecraft()

  if (inMinecraft) {
    return null
  }

  const title = message ?? t(messageKey)
  const detail = description ?? t(descriptionKey)

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.08] p-3',
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
      <div className="min-w-0 flex-1 text-sm text-yellow-600">
        <p className="font-medium">{title}</p>
        <p className="text-xs opacity-75">{detail}</p>
      </div>
    </div>
  )
}
