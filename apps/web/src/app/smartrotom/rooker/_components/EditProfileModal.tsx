"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { cn } from "@/lib/utils"
import { Button, Icon, Modal, Sprite, toast } from "./ui"
import { useRookerUuid, useUpdateProfile } from "../_hooks/queries"
import { useVitrina } from "../_hooks/useVitrina"
import type { RookerProfile } from "../_types"

const HANDLE_RE = /^[a-z0-9_]{3,32}$/

/**
 * Editing your own page.
 *
 * The partner picker only offers Pokémon you have **actually caught** — it is drawn
 * from your Pokédex registry, not from the full species list. That is the whole point
 * of the partner: it is the one decorative thing on the profile, but it still has to be
 * true. Picking it is choosing which of your real captures represents you.
 *
 * The handle is validated here against the same `^[a-z0-9_]{3,32}$` the server enforces,
 * so the common mistake is caught before the round trip; a collision still comes back
 * as a 409, because only the database can know.
 */
export function EditProfileModal({
  open,
  onClose,
  profile,
}: {
  open: boolean
  onClose: () => void
  profile: RookerProfile
}) {
  const t = useTranslations("rooker")
  const uuid = useRookerUuid()
  const update = useUpdateProfile()
  const { data: vitrina } = useVitrina(uuid)
  const allPokemon = usePokemonStore((s) => s.allPokemon)

  const [handle, setHandle] = useState(profile.handle)
  const [displayName, setDisplayName] = useState(profile.displayName ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [link, setLink] = useState(profile.link ?? "")
  const [partner, setPartner] = useState<number | null>(profile.partnerPokemonId)

  useEffect(() => {
    if (!open) return
    setHandle(profile.handle)
    setDisplayName(profile.displayName ?? "")
    setBio(profile.bio ?? "")
    setLink(profile.link ?? "")
    setPartner(profile.partnerPokemonId)
  }, [open, profile])

  // One tile per species caught, newest first — a trainer with forty Rattata should see
  // one Rattata, not forty.
  const owned = useMemo(() => {
    const seen = new Set<number>()
    return (vitrina ?? []).filter((e) => {
      if (seen.has(e.dex)) return false
      seen.add(e.dex)
      return true
    })
  }, [vitrina])

  const handleValid = HANDLE_RE.test(handle)
  const blocked = !handleValid || update.isPending

  const submit = () => {
    if (blocked) return
    update.mutate(
      {
        handle,
        displayName: displayName.trim(),
        bio: bio.trim(),
        link: link.trim(),
        partnerPokemonId: partner,
      },
      {
        onSuccess: () => {
          onClose()
          toast(t("toast.profileUpdated"))
        },
        onError: (err) =>
          toast(
            err instanceof Error && /409|exist|uso/i.test(err.message)
              ? t("toast.handleTaken")
              : t("toast.profileSaveFailed"),
          ),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} label={t("editProfile.title")}>
      <div className="flex items-center justify-between border-b border-rk-line px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="grid h-8 w-8 place-items-center rounded-full text-rk-fg transition-colors hover:bg-rk-hover"
        >
          <Icon name="close" size={20} />
        </button>
        <h2 className="text-[1.0625rem] font-extrabold text-rk-fg">{t("editProfile.title")}</h2>
        <Button intent="accent" onClick={submit} disabled={blocked} className="px-4 py-1.5 text-[0.8125rem]">
          {update.isPending ? t("editProfile.saving") : t("editProfile.saveButton")}
        </Button>
      </div>

      <div className="rk-scroll max-h-[70vh] space-y-4 overflow-y-auto p-4">
        <label className="block">
          <span className="text-[0.8125rem] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">{t("editProfile.fields.handle.label")}</span>
          <div
            className={cn(
              "mt-1.5 flex items-center rounded-rk-md border bg-rk-card px-3",
              handleValid ? "border-rk-line-strong focus-within:border-rk-accent" : "border-rk-ball",
            )}
          >
            <span className="text-[0.9375rem] text-rk-fg-subtle">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              maxLength={32}
              className="w-full bg-transparent px-1 py-2 text-[0.9375rem] text-rk-fg outline-none"
            />
          </div>
          {!handleValid && (
            <p className="mt-1 text-[0.78125rem] text-rk-ball">
              {t("editProfile.fields.handle.error")}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-[0.8125rem] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">{t("editProfile.fields.displayName.label")}</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={48}
            className="mt-1.5 w-full rounded-rk-md border border-rk-line-strong bg-rk-card px-3 py-2 text-[0.9375rem] text-rk-fg outline-none focus:border-rk-accent"
          />
        </label>

        <label className="block">
          <span className="text-[0.8125rem] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">{t("editProfile.fields.bio.label")}</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-rk-md border border-rk-line-strong bg-rk-card px-3 py-2 text-[0.9375rem] text-rk-fg outline-none focus:border-rk-accent"
          />
          <span className="mt-0.5 block text-right text-[0.75rem] tabular-nums text-rk-fg-subtle">
            {bio.length}/280
          </span>
        </label>

        <label className="block">
          <span className="text-[0.8125rem] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">{t("editProfile.fields.link.label")}</span>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            maxLength={120}
            placeholder={t("editProfile.fields.link.placeholder")}
            className="mt-1.5 w-full rounded-rk-md border border-rk-line-strong bg-rk-card px-3 py-2 text-[0.9375rem] text-rk-fg outline-none focus:border-rk-accent"
          />
        </label>

        <div>
          <span className="text-[0.8125rem] font-bold uppercase tracking-[.04em] text-rk-fg-subtle">
            {t("editProfile.fields.partner.label")}
          </span>
          <p className="mb-2 mt-0.5 text-[0.78125rem] text-rk-fg-subtle">
            {t("editProfile.fields.partner.hint")}
          </p>

          {owned.length ? (
            <div className="rk-scroll grid max-h-[11.875rem] grid-cols-6 gap-1.5 overflow-y-auto">
              {owned.map((e) => (
                <button
                  key={e.dex}
                  type="button"
                  onClick={() => setPartner(partner === e.dex ? null : e.dex)}
                  aria-pressed={partner === e.dex}
                  aria-label={allPokemon.find((p) => p.dex === e.dex)?.name ?? `#${e.dex}`}
                  className={cn(
                    "grid aspect-square place-items-center rounded-rk-md border transition-colors",
                    partner === e.dex
                      ? "border-rk-accent bg-rk-accent/15"
                      : "border-rk-line bg-rk-card hover:bg-rk-hover",
                  )}
                >
                  <Sprite dex={e.dex} form={e.form} palette={e.palette} size={40} />
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-rk-md border border-rk-line bg-rk-card px-3 py-3 text-[0.84375rem] text-rk-fg-subtle">
              {t("editProfile.fields.partner.empty")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
