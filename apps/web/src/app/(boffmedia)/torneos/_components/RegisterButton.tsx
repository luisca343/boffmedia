"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button, Field, Input, Modal, toast } from "@/components/boffmedia/primitives"
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
  const { status } = useSession()
  const [busy, setBusy] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)

  if (detail.status !== "registration" || !detail.registrationOpen) return null

  if (status !== "authenticated") {
    return (
      <Button href="/entrar" size="sm">
        Inicia sesión para apuntarte
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
      toast.success("¡Inscrito en el torneo!")
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
      toast("Inscripción cancelada")
      onChange()
    }
  }

  if (registered) {
    return (
      <Button size="sm" disabled={busy} onClick={doWithdraw}>
        Cancelar inscripción
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
        Apuntarme
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
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [members, setMembers] = useState<string[]>([""])

  const submit = () => {
    if (!name.trim()) return toast.error("El nombre del equipo es obligatorio")
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
      title="Inscribir equipo"
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="pri" size="sm" disabled={busy} onClick={submit}>
            Inscribir
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Nombre del equipo">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team Rocket" />
          </Field>
          <Field label="Tag">
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="TR" className="w-24" />
          </Field>
        </div>
        <div className="grid gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
            Miembros (opcional)
          </span>
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={m}
                onChange={(e) =>
                  setMembers((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder={`Jugador ${i + 1}`}
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMembers((cur) => cur.filter((_, j) => j !== i))}
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
            className="justify-self-start font-mono text-[11px] text-accent transition-opacity hover:opacity-70"
          >
            + Añadir miembro
          </button>
        </div>
      </div>
    </Modal>
  )
}
