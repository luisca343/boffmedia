"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button, toast } from "@/components/boffmedia/primitives"
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
  const { data: session, status } = useSession()
  const [busy, setBusy] = useState(false)

  if (detail.status !== "registration" || !detail.registrationOpen) return null

  if (status !== "authenticated") {
    return (
      <Button href="/entrar" size="sm">
        Inicia sesión para apuntarte
      </Button>
    )
  }

  const myName = session?.user?.name ?? undefined
  const registered =
    !!myName && detail.participants.some((p) => p.name === myName)

  const doRegister = async () => {
    setBusy(true)
    const r = await TournamentsService.register(detail.id, {})
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success("¡Inscrito en el torneo!")
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

  return registered ? (
    <Button size="sm" disabled={busy} onClick={doWithdraw}>
      Cancelar inscripción
    </Button>
  ) : (
    <Button variant="pri" size="sm" icon="plus" disabled={busy} onClick={doRegister}>
      Apuntarme
    </Button>
  )
}
