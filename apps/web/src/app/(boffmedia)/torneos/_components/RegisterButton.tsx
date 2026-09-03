"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Modal, toast } from "@boffmedia/ui"
import {
  TournamentsService,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"

/** Register/withdraw for the current user while a tournament is in registration. */
export function RegisterButton({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const t = useTranslations("torneos.register")
  const { status } = useSession()
  const [busy, setBusy] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)

  if (detail.status !== "registration" || !detail.registrationOpen) return null

  if (status !== "authenticated") {
    return (
      <Button href="/entrar" size="sm">
        {t("loginPrompt")}
      </Button>
    )
  }

  // The API tells us directly whether the signed-in caller is registered — no
  // fragile display-name matching.
  const registered = detail.viewerParticipantId != null
  const isTeam = detail.competitorKind === "team"

  const submitRegister = async (body: Parameters<typeof TournamentsService.register>[1]) => {
    setBusy(true)
    const r = await TournamentsService.register(detail.id, body)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success(t("toastRegistered"))
      setTeamOpen(false)
      onChange()
    }
  }

  const doWithdraw = async () => {
    setBusy(true)
    const r = await TournamentsService.withdraw(detail.id)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast(t("toastWithdrawn"))
      onChange()
    }
  }

  if (registered) {
    return (
      <Button size="sm" disabled={busy} onClick={doWithdraw}>
        {t("withdrawBtn")}
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="pri"
        size="sm"
        icon="plus"
        disabled={busy}
        onClick={() => (isTeam ? setTeamOpen(true) : submitRegister({}))}
      >
        {t("registerBtn")}
      </Button>
      {isTeam && (
        <TeamRegisterModal
          open={teamOpen}
          busy={busy}
          onClose={() => setTeamOpen(false)}
          onSubmit={submitRegister}
        />
      )}
    </>
  )
}

function TeamRegisterModal({
  open,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean
  busy: boolean
  onClose: () => void
  onSubmit: (body: { name?: string; tag?: string; roster?: { name: string }[] }) => void
}) {
  const t = useTranslations("torneos.register")
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [members, setMembers] = useState<string[]>([""])

  const submit = () => {
    if (!name.trim()) return toast.error(t("teamNameRequired"))
    const roster = members
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m) => ({ name: m }))
    onSubmit({
      name: name.trim(),
      tag: tag.trim() || undefined,
      roster: roster.length ? roster : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("teamModalTitle")}
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="pri" size="sm" disabled={busy} onClick={submit}>
            {t("teamSubmitBtn")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label={t("teamNameLabel")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team Rocket" />
          </Field>
          <Field label={t("teamTagLabel")}>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="TR" className="w-24" />
          </Field>
        </div>
        <div className="grid gap-1.5">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
            {t("teamMembersLabel")}
          </span>
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={m}
                onChange={(e) =>
                  setMembers((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder={t("teamMemberPlaceholder", { n: i + 1 })}
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMembers((cur) => cur.filter((_, j) => j !== i))}
                  // The glyph is the only content, so a screen reader announces
                  // "button" with nothing to distinguish one row from another.
                  aria-label={t("teamRemoveMember", { n: i + 1 })}
                  className="px-1 text-txt-dim transition-colors hover:text-bad"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMembers((cur) => [...cur, ""])}
            className="justify-self-start font-mono text-[0.6875rem] text-accent transition-opacity hover:opacity-70"
          >
            {t("teamAddMember")}
          </button>
        </div>
      </div>
    </Modal>
  )
}
