"use client"

import { Avatar, Button, Icon } from "./ui"
import { useComposeStore } from "../_stores/composeStore"
import { useMe } from "../_hooks/queries"

/**
 * The one-line composer at the top of the feed. It does not compose anything itself —
 * it is a doorway into the real dialog, which is the only place a trino is written.
 * That keeps a single draft, a single character counter and a single submit path.
 */
export function ComposeInline() {
  const { data: me } = useMe()
  const openCompose = useComposeStore((s) => s.openCompose)

  if (!me) return null

  return (
    <div className="border-b border-rk-line px-4 py-3.5">
      <div className="flex gap-3">
        <Avatar
          user={{ uuid: me.uuid, username: me.username, partnerPokemonId: me.partnerPokemonId }}
          size={46}
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => openCompose("text")}
            className="w-full cursor-text py-2 text-left text-[18px] text-rk-fg-subtle"
          >
            ¿Qué está trinando, {me.displayName || me.username}?
          </button>
          <div className="mt-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => openCompose("media")}
              aria-label="Adjuntar imagen"
              className="grid h-[34px] w-[34px] place-items-center rounded-full text-rk-accent transition-colors hover:bg-rk-accent/12"
            >
              <Icon name="image" size={18} />
            </button>
            <Button intent="accent" onClick={() => openCompose("text")} className="px-5">
              Trinar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
