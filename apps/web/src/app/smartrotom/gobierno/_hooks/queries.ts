"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { GobiernoService } from "@/services/api/smartrotom/gobiernoService"
import { userMessageFrom } from "@/services/boffAPI"
import { toast } from "../_components/ui"
import { useOfficer } from "./useOfficer"
import type {
  Anuncio,
  Apelacion,
  AuditEntry,
  BitacoraEntry,
  Buscado,
  Cartel,
  Ciudadano,
  Counters,
  Denuncia,
  Evento,
  Expediente,
  MegafoniaEntry,
  Multa,
  NpcSkin,
  Oficial,
  Paged,
  Parcela,
  ParcelaHistorial,
  Patrulla,
  Subasta,
  Tesoreria,
  Zona,
} from "../_types"
import {
  mapPaged,
  normalizeAnuncio,
  normalizeApelacion,
  normalizeAuditEntry,
  normalizeBitacoraEntry,
  normalizeBuscado,
  normalizeDenuncia,
  normalizeEvento,
  normalizeExpediente,
  normalizeMegafoniaEntry,
  normalizeMulta,
  normalizeParcela,
  normalizeParcelaHistorial,
  normalizePatrulla,
  normalizeSubasta,
} from "../_utils/personRef"

type Query = Record<string, string | number | boolean | undefined | null>

export const gobKeys = {
  counters: ["gob", "counters"] as const,
  zonas: (q?: Query) => ["gob", "zonas", q ?? {}] as const,
  parcelas: (q?: Query) => ["gob", "parcelas", q ?? {}] as const,
  historial: (q?: Query) => ["gob", "historial", q ?? {}] as const,
  parcelaHistorial: (regionId: string) => ["gob", "parcela-historial", regionId] as const,
  subastas: (q?: Query) => ["gob", "subastas", q ?? {}] as const,
  denuncias: (q?: Query) => ["gob", "denuncias", q ?? {}] as const,
  buscados: (q?: Query) => ["gob", "buscados", q ?? {}] as const,
  patrullas: ["gob", "patrullas"] as const,
  bitacora: (q?: Query) => ["gob", "bitacora", q ?? {}] as const,
  multas: (q?: Query) => ["gob", "multas", q ?? {}] as const,
  tesoreria: ["gob", "tesoreria"] as const,
  expedientes: (q?: Query) => ["gob", "expedientes", q ?? {}] as const,
  expediente: (id: number) => ["gob", "expediente", id] as const,
  apelaciones: (q?: Query) => ["gob", "apelaciones", q ?? {}] as const,
  censo: (q?: Query) => ["gob", "censo", q ?? {}] as const,
  ciudadano: (uuid: string) => ["gob", "ciudadano", uuid] as const,
  oficiales: ["gob", "oficiales"] as const,
  anuncios: (q?: Query) => ["gob", "anuncios", q ?? {}] as const,
  auditoria: (q?: Query) => ["gob", "auditoria", q ?? {}] as const,
  eventos: (q?: Query) => ["gob", "eventos", q ?? {}] as const,
  evento: (id: number) => ["gob", "evento", id] as const,
  npcSkins: ["gob", "npc-skins"] as const,
  megafonia: (q?: Query) => ["gob", "megafonia", q ?? {}] as const,
  carteles: ["gob", "carteles"] as const,
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export const useCounters = () =>
  useQuery({
    queryKey: gobKeys.counters,
    queryFn: () => GobiernoService.counters() as Promise<Counters>,
    staleTime: 30_000,
  })

export const useZonas = (q?: Query) =>
  useQuery({ queryKey: gobKeys.zonas(q), queryFn: () => GobiernoService.zonas(q) as Promise<Zona[]> })

export const useParcelas = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.parcelas(q),
    queryFn: () => GobiernoService.parcelas(q).then((d) => mapPaged(d, normalizeParcela)) as Promise<Paged<Parcela>>,
  })

export const useHistorial = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.historial(q),
    queryFn: () =>
      GobiernoService.historial(q).then((d) => mapPaged(d, normalizeParcelaHistorial)) as Promise<
        Paged<ParcelaHistorial>
      >,
  })

export const useSubastas = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.subastas(q),
    queryFn: () => GobiernoService.subastas(q).then((d) => mapPaged(d, normalizeSubasta)) as Promise<Paged<Subasta>>,
  })

export const useDenuncias = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.denuncias(q),
    queryFn: () => GobiernoService.denuncias(q).then((d) => mapPaged(d, normalizeDenuncia)) as Promise<Paged<Denuncia>>,
  })

export const useBuscados = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.buscados(q),
    queryFn: () => GobiernoService.buscados(q).then((d) => mapPaged(d, normalizeBuscado)) as Promise<Paged<Buscado>>,
  })

export const usePatrullas = () =>
  useQuery({
    queryKey: gobKeys.patrullas,
    queryFn: () =>
      GobiernoService.patrullas().then(
        (d) => (Array.isArray(d) ? d.map(normalizePatrulla) : d),
      ) as Promise<Patrulla[]>,
  })

export const useBitacora = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.bitacora(q),
    queryFn: () =>
      GobiernoService.bitacora(q).then(
        (d) => (Array.isArray(d) ? d.map(normalizeBitacoraEntry) : d),
      ) as Promise<BitacoraEntry[]>,
  })

export const useMultas = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.multas(q),
    queryFn: () => GobiernoService.multas(q).then((d) => mapPaged(d, normalizeMulta)) as Promise<Paged<Multa>>,
  })

export const useTesoreria = () =>
  useQuery({ queryKey: gobKeys.tesoreria, queryFn: () => GobiernoService.tesoreria() as Promise<Tesoreria> })

export const useExpedientes = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.expedientes(q),
    queryFn: () =>
      GobiernoService.expedientes(q).then((d) => mapPaged(d, normalizeExpediente)) as Promise<Paged<Expediente>>,
  })

export const useExpediente = (id: number | null) =>
  useQuery({
    queryKey: gobKeys.expediente(id ?? 0),
    queryFn: () => GobiernoService.expediente(id as number).then(normalizeExpediente) as Promise<Expediente>,
    enabled: id != null,
  })

export const useApelaciones = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.apelaciones(q),
    queryFn: () =>
      GobiernoService.apelaciones(q).then((d) => mapPaged(d, normalizeApelacion)) as Promise<Paged<Apelacion>>,
  })

export const useCenso = (q?: Query) =>
  useQuery({ queryKey: gobKeys.censo(q), queryFn: () => GobiernoService.censo(q) as Promise<Paged<Ciudadano>> })

export const useCiudadano = (uuid: string | null) =>
  useQuery({
    queryKey: gobKeys.ciudadano(uuid ?? ""),
    queryFn: () => GobiernoService.ciudadano(uuid as string) as Promise<Ciudadano>,
    enabled: !!uuid,
  })

export const useOficiales = () =>
  useQuery({ queryKey: gobKeys.oficiales, queryFn: () => GobiernoService.oficiales() as Promise<Oficial[]> })

export const useAnuncios = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.anuncios(q),
    queryFn: () => GobiernoService.anuncios(q).then((d) => mapPaged(d, normalizeAnuncio)) as Promise<Paged<Anuncio>>,
  })

export const useAuditoria = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.auditoria(q),
    queryFn: () =>
      GobiernoService.auditoria(q).then((d) => mapPaged(d, normalizeAuditEntry)) as Promise<Paged<AuditEntry>>,
  })

export const useEventos = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.eventos(q),
    queryFn: () =>
      GobiernoService.eventos(q).then((d) => (Array.isArray(d) ? d.map(normalizeEvento) : d)) as Promise<Evento[]>,
  })

export const useEvento = (id: number | null) =>
  useQuery({
    queryKey: gobKeys.evento(id ?? 0),
    queryFn: () => GobiernoService.evento(id as number).then(normalizeEvento) as Promise<Evento>,
    enabled: id != null,
  })

export const useNpcSkins = () =>
  useQuery({ queryKey: gobKeys.npcSkins, queryFn: () => GobiernoService.npcSkins() as Promise<NpcSkin[]> })

export const useMegafonia = (q?: Query) =>
  useQuery({
    queryKey: gobKeys.megafonia(q),
    queryFn: () =>
      GobiernoService.megafonia(q).then(
        (d) => (Array.isArray(d) ? d.map(normalizeMegafoniaEntry) : d),
      ) as Promise<MegafoniaEntry[]>,
  })

export const useCarteles = () =>
  useQuery({ queryKey: gobKeys.carteles, queryFn: () => GobiernoService.carteles() as Promise<Cartel[]> })

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Every mutation lands in the audit log, and the money ones move the treasury too — so a
 * successful write always invalidates `auditoria` and `counters`, and the money ones also
 * invalidate `tesoreria`. Invalidating together is what keeps a paid fine from showing as
 * paid on one screen and pending on the next.
 */
function useGobMutation<TArgs, TData>(
  fn: (args: TArgs) => Promise<unknown>,
  opts: { keys: readonly unknown[][]; money?: boolean; success?: (data: TData, args: TArgs) => string },
) {
  const qc = useQueryClient()
  const t = useTranslations("gobierno")
  return useMutation({
    mutationFn: (args: TArgs) => fn(args) as Promise<TData>,
    onSuccess: (data, args) => {
      const keys = [...opts.keys, ["gob", "auditoria"], ["gob", "counters"]]
      if (opts.money) keys.push(["gob", "tesoreria"])
      keys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      const msg = opts.success?.(data, args)
      if (msg) toast.success(msg)
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, t("toast.genericError"))),
  })
}

export const useCreateDenuncia = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Denuncia>((b) => GobiernoService.createDenuncia(b).then(normalizeDenuncia), {
    keys: [["gob", "denuncias"]],
    success: (d) => t("toast.denunciaRegistrada", { code: d.code }),
  })
}

export const useResolveDenuncia = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; resolution: string; status: string }, Denuncia>(
    ({ id, ...b }) => GobiernoService.resolveDenuncia(id, b).then(normalizeDenuncia),
    { keys: [["gob", "denuncias"]], success: (d) => t("toast.denunciaResuelta", { code: d.code }) },
  )
}

export const useCreateMulta = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Multa>((b) => GobiernoService.createMulta(b).then(normalizeMulta), {
    keys: [["gob", "multas"]],
    success: (m) => t("toast.multaEmitida", { code: m.code }),
  })
}

export const usePayMulta = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<number, Multa>((id) => GobiernoService.payMulta(id).then(normalizeMulta), {
    keys: [["gob", "multas"], ["gob", "apelaciones"]],
    money: true,
    success: (m) => t("toast.multaPagada", { code: m.code }),
  })
}

// CancelMultaDto requires actorUuid — inject it here rather than at the call site so a
// page can't omit it (which is exactly how this shipped 400ing).
export const useCancelMulta = () => {
  const t = useTranslations("gobierno")
  const officer = useOfficer()
  return useGobMutation<number, Multa>(
    (id) => GobiernoService.cancelMulta(id, officer.uuid).then(normalizeMulta),
    { keys: [["gob", "multas"]], success: (m) => t("toast.multaAnulada", { code: m.code }) },
  )
}

export const useCreateBuscado = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Buscado>((b) => GobiernoService.createBuscado(b).then(normalizeBuscado), {
    keys: [["gob", "buscados"]],
    success: (b) => t("toast.buscadoAnadido", { username: b.player.username }),
  })
}

export const useCaptureBuscado = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; capturedBy: string }, Buscado>(
    ({ id, ...b }) => GobiernoService.captureBuscado(id, b).then(normalizeBuscado),
    {
      keys: [["gob", "buscados"]],
      money: true,
      success: () => t("toast.capturaConfirmada"),
    },
  )
}

export const useCreateSubasta = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Subasta>((b) => GobiernoService.createSubasta(b).then(normalizeSubasta), {
    keys: [["gob", "subastas"], ["gob", "parcelas"]],
    success: (s) => t("toast.subastaAbierta", { code: s.code }),
  })
}

export const usePuja = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; uuid: string; amount: number }, Subasta>(
    ({ id, ...b }) => GobiernoService.puja(id, b).then(normalizeSubasta),
    { keys: [["gob", "subastas"]], success: (s) => t("toast.pujaRegistrada", { code: s.code }) },
  )
}

export const useCloseSubasta = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<number, Subasta>((id) => GobiernoService.closeSubasta(id).then(normalizeSubasta), {
    keys: [["gob", "subastas"], ["gob", "parcelas"]],
    money: true,
    success: (s) => t("toast.subastaAdjudicada", { code: s.code }),
  })
}

export const useResolveApelacion = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; outcome: "upheld" | "overturned"; decision: string }, Apelacion>(
    ({ id, ...b }) => GobiernoService.resolveApelacion(id, b).then(normalizeApelacion),
    {
      keys: [["gob", "apelaciones"], ["gob", "multas"]],
      money: true,
      success: (a) =>
        a.status === "overturned"
          ? t("toast.apelacionEstimada", { code: a.code })
          : t("toast.apelacionDesestimada", { code: a.code }),
    },
  )
}

export const useCreateExpediente = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Expediente>((b) => GobiernoService.createExpediente(b).then(normalizeExpediente), {
    keys: [["gob", "expedientes"]],
    success: (e) => t("toast.expedienteAbierto", { code: e.code }),
  })
}

export const useAddExpedienteEvento = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; kind: string; text: string; ref?: string }, unknown>(
    ({ id, ...b }) => GobiernoService.addExpedienteEvento(id, b),
    { keys: [["gob", "expedientes"], ["gob", "expediente"]], success: () => t("toast.notaAdded") },
  )
}

export const useCreateZona = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Zona>((b) => GobiernoService.createZona(b), {
    keys: [["gob", "zonas"], ["gob", "parcelas"]],
    success: (z) => t("toast.zonaCreada", { name: z.name }),
  })
}

export const useUpdateZona = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; [k: string]: unknown }, Zona>(({ id, ...b }) => GobiernoService.updateZona(id, b), {
    keys: [["gob", "zonas"], ["gob", "parcelas"]],
    success: (z) => t("toast.zonaActualizada", { name: z.name }),
  })
}

export const useUpdateParcela = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ regionId: string; [k: string]: unknown }, Parcela>(
    ({ regionId, ...b }) => GobiernoService.updateParcela(regionId, b).then(normalizeParcela),
    { keys: [["gob", "parcelas"], ["gob", "zonas"]], success: () => t("toast.parcelaActualizada") },
  )
}

export const useAddBitacora = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, BitacoraEntry>((b) => GobiernoService.addBitacora(b).then(normalizeBitacoraEntry), {
    keys: [["gob", "bitacora"], ["gob", "patrullas"]],
    success: () => t("toast.bitacoraAnadida"),
  })
}

export const useCreatePatrulla = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Patrulla>((b) => GobiernoService.createPatrulla(b).then(normalizePatrulla), {
    keys: [["gob", "patrullas"]],
    success: (p) => t("toast.turnoCreado", { label: p.label }),
  })
}

export const useUpdatePatrulla = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; [k: string]: unknown }, Patrulla>(
    ({ id, ...b }) => GobiernoService.updatePatrulla(id, b).then(normalizePatrulla),
    { keys: [["gob", "patrullas"]], success: (p) => t("toast.turnoActualizado", { label: p.label }) },
  )
}

export const useCreateAnuncio = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Anuncio>((b) => GobiernoService.createAnuncio(b).then(normalizeAnuncio), {
    keys: [["gob", "anuncios"]],
    success: (a) => t("toast.anuncioTituloPublicado", { title: a.title }),
  })
}

export const useUpdateAnuncio = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; [k: string]: unknown }, Anuncio>(
    ({ id, ...b }) => GobiernoService.updateAnuncio(id, b).then(normalizeAnuncio),
    { keys: [["gob", "anuncios"]], success: () => t("toast.anuncioActualizado") },
  )
}

export const useDeleteAnuncio = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<number, unknown>((id) => GobiernoService.deleteAnuncio(id), {
    keys: [["gob", "anuncios"]],
    success: () => t("toast.anuncioRetirado"),
  })
}

export const useCreateEvento = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Evento>((b) => GobiernoService.createEvento(b).then(normalizeEvento), {
    keys: [["gob", "eventos"]],
    success: (e) => t("toast.eventoCreado", { code: e.code }),
  })
}

export const useUpdateEvento = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ id: number; [k: string]: unknown }, Evento>(
    ({ id, ...b }) => GobiernoService.updateEvento(id, b).then(normalizeEvento),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => t("toast.eventoActualizado") },
  )
}

export const useCreateObra = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ eventoId: number; [k: string]: unknown }, unknown>(
    ({ eventoId, ...b }) => GobiernoService.createObra(eventoId, b),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => t("toast.obraRegistrada") },
  )
}

export const useSetEspecies = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ eventoId: number; especies: unknown[] }, unknown>(
    ({ eventoId, especies }) => GobiernoService.setEspecies(eventoId, { especies }),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => t("toast.tablaGuardada") },
  )
}

export const useGrantRole = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ uuid: string; role: string }, unknown>(({ uuid, role }) => GobiernoService.grantRole(uuid, { role }), {
    keys: [["gob", "oficiales"]],
    success: () => t("toast.nombramientoRegistrado"),
  })
}

export const useRevokeRole = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ uuid: string; role: string }, unknown>(
    ({ uuid, role }) => GobiernoService.revokeRole(uuid, role),
    { keys: [["gob", "oficiales"]], success: () => t("toast.ceseRegistrado") },
  )
}

export const useUpsertNpcSkin = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, NpcSkin>((b) => GobiernoService.upsertNpcSkin(b), {
    keys: [["gob", "npc-skins"]],
    success: (s) => t("toast.skinGuardada", { skin: s.skin }),
  })
}

export const useSendMegafonia = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<{ speaker: string; text: string; byUuid: string }, unknown>((b) => GobiernoService.sendMegafonia(b), {
    keys: [["gob", "megafonia"]],
    success: () => t("toast.mensajeEmitido"),
  })
}

export const useCreateCartel = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<unknown, Cartel>((b) => GobiernoService.createCartel(b), {
    keys: [["gob", "carteles"]],
    success: (c) => t("toast.cartelGuardado", { name: c.name }),
  })
}

export const useDeleteCartel = () => {
  const t = useTranslations("gobierno")
  return useGobMutation<number, unknown>((id) => GobiernoService.deleteCartel(id), {
    keys: [["gob", "carteles"]],
    success: () => t("toast.cartelEliminado"),
  })
}
