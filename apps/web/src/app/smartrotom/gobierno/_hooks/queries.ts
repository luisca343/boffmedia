"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { GobiernoService } from "@/services/api/smartrotom/gobiernoService"
import { userMessageFrom } from "@/services/boffAPI"
import { toast } from "../_components/ui"
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
  return useMutation({
    mutationFn: (args: TArgs) => fn(args) as Promise<TData>,
    onSuccess: (data, args) => {
      const keys = [...opts.keys, ["gob", "auditoria"], ["gob", "counters"]]
      if (opts.money) keys.push(["gob", "tesoreria"])
      keys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      const msg = opts.success?.(data, args)
      if (msg) toast.success(msg)
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, "La solicitud al Gobierno de Teras ha fallado.")),
  })
}

export const useCreateDenuncia = () =>
  useGobMutation<unknown, Denuncia>((b) => GobiernoService.createDenuncia(b).then(normalizeDenuncia), {
    keys: [["gob", "denuncias"]],
    success: (d) => `Denuncia ${d.code} registrada`,
  })

export const useResolveDenuncia = () =>
  useGobMutation<{ id: number; resolution: string; status: string }, Denuncia>(
    ({ id, ...b }) => GobiernoService.resolveDenuncia(id, b).then(normalizeDenuncia),
    { keys: [["gob", "denuncias"]], success: (d) => `Denuncia ${d.code} resuelta` },
  )

export const useCreateMulta = () =>
  useGobMutation<unknown, Multa>((b) => GobiernoService.createMulta(b).then(normalizeMulta), {
    keys: [["gob", "multas"]],
    success: (m) => `Multa ${m.code} emitida`,
  })

export const usePayMulta = () =>
  useGobMutation<number, Multa>((id) => GobiernoService.payMulta(id).then(normalizeMulta), {
    keys: [["gob", "multas"], ["gob", "apelaciones"]],
    money: true,
    success: (m) => `Multa ${m.code} pagada a la Tesorería`,
  })

export const useCancelMulta = () =>
  useGobMutation<number, Multa>((id) => GobiernoService.cancelMulta(id).then(normalizeMulta), {
    keys: [["gob", "multas"]],
    success: (m) => `Multa ${m.code} anulada`,
  })

export const useCreateBuscado = () =>
  useGobMutation<unknown, Buscado>((b) => GobiernoService.createBuscado(b).then(normalizeBuscado), {
    keys: [["gob", "buscados"]],
    success: (b) => `${b.player.username} añadido a busca y captura`,
  })

export const useCaptureBuscado = () =>
  useGobMutation<{ id: number; capturedBy: string }, Buscado>(
    ({ id, ...b }) => GobiernoService.captureBuscado(id, b).then(normalizeBuscado),
    {
      keys: [["gob", "buscados"]],
      money: true,
      success: (b) => `Captura confirmada · recompensa pagada`,
    },
  )

export const useCreateSubasta = () =>
  useGobMutation<unknown, Subasta>((b) => GobiernoService.createSubasta(b).then(normalizeSubasta), {
    keys: [["gob", "subastas"], ["gob", "parcelas"]],
    success: (s) => `Subasta ${s.code} abierta`,
  })

export const usePuja = () =>
  useGobMutation<{ id: number; uuid: string; amount: number }, Subasta>(
    ({ id, ...b }) => GobiernoService.puja(id, b).then(normalizeSubasta),
    { keys: [["gob", "subastas"]], success: (s) => `Puja registrada · ${s.code}` },
  )

export const useCloseSubasta = () =>
  useGobMutation<number, Subasta>((id) => GobiernoService.closeSubasta(id).then(normalizeSubasta), {
    keys: [["gob", "subastas"], ["gob", "parcelas"]],
    money: true,
    success: (s) => `Subasta ${s.code} adjudicada`,
  })

export const useResolveApelacion = () =>
  useGobMutation<{ id: number; outcome: "upheld" | "overturned"; decision: string }, Apelacion>(
    ({ id, ...b }) => GobiernoService.resolveApelacion(id, b).then(normalizeApelacion),
    {
      keys: [["gob", "apelaciones"], ["gob", "multas"]],
      money: true,
      success: (a) => `Apelación ${a.code} ${a.status === "overturned" ? "estimada" : "desestimada"}`,
    },
  )

export const useCreateExpediente = () =>
  useGobMutation<unknown, Expediente>((b) => GobiernoService.createExpediente(b).then(normalizeExpediente), {
    keys: [["gob", "expedientes"]],
    success: (e) => `Expediente ${e.code} abierto`,
  })

export const useAddExpedienteEvento = () =>
  useGobMutation<{ id: number; kind: string; text: string; ref?: string }, unknown>(
    ({ id, ...b }) => GobiernoService.addExpedienteEvento(id, b),
    { keys: [["gob", "expedientes"], ["gob", "expediente"]], success: () => "Anotación añadida al expediente" },
  )

export const useCreateZona = () =>
  useGobMutation<unknown, Zona>((b) => GobiernoService.createZona(b), {
    keys: [["gob", "zonas"], ["gob", "parcelas"]],
    success: (z) => `Zona «${z.name}» creada`,
  })

export const useUpdateZona = () =>
  useGobMutation<{ id: number; [k: string]: unknown }, Zona>(({ id, ...b }) => GobiernoService.updateZona(id, b), {
    keys: [["gob", "zonas"], ["gob", "parcelas"]],
    success: (z) => `Zona «${z.name}» actualizada`,
  })

export const useUpdateParcela = () =>
  useGobMutation<{ regionId: string; [k: string]: unknown }, Parcela>(
    ({ regionId, ...b }) => GobiernoService.updateParcela(regionId, b).then(normalizeParcela),
    { keys: [["gob", "parcelas"], ["gob", "zonas"]], success: () => "Parcela actualizada" },
  )

export const useAddBitacora = () =>
  useGobMutation<unknown, BitacoraEntry>((b) => GobiernoService.addBitacora(b).then(normalizeBitacoraEntry), {
    keys: [["gob", "bitacora"], ["gob", "patrullas"]],
    success: () => "Anotación registrada en la bitácora",
  })

export const useCreatePatrulla = () =>
  useGobMutation<unknown, Patrulla>((b) => GobiernoService.createPatrulla(b).then(normalizePatrulla), {
    keys: [["gob", "patrullas"]],
    success: (p) => `Turno «${p.label}» creado`,
  })

export const useUpdatePatrulla = () =>
  useGobMutation<{ id: number; [k: string]: unknown }, Patrulla>(
    ({ id, ...b }) => GobiernoService.updatePatrulla(id, b).then(normalizePatrulla),
    { keys: [["gob", "patrullas"]], success: (p) => `Turno «${p.label}» actualizado` },
  )

export const useCreateAnuncio = () =>
  useGobMutation<unknown, Anuncio>((b) => GobiernoService.createAnuncio(b).then(normalizeAnuncio), {
    keys: [["gob", "anuncios"]],
    success: (a) => `«${a.title}» publicado`,
  })

export const useUpdateAnuncio = () =>
  useGobMutation<{ id: number; [k: string]: unknown }, Anuncio>(
    ({ id, ...b }) => GobiernoService.updateAnuncio(id, b).then(normalizeAnuncio),
    { keys: [["gob", "anuncios"]], success: () => "Anuncio actualizado" },
  )

export const useDeleteAnuncio = () =>
  useGobMutation<number, unknown>((id) => GobiernoService.deleteAnuncio(id), {
    keys: [["gob", "anuncios"]],
    success: () => "Anuncio retirado",
  })

export const useCreateEvento = () =>
  useGobMutation<unknown, Evento>((b) => GobiernoService.createEvento(b).then(normalizeEvento), {
    keys: [["gob", "eventos"]],
    success: (e) => `Evento ${e.code} creado`,
  })

export const useUpdateEvento = () =>
  useGobMutation<{ id: number; [k: string]: unknown }, Evento>(
    ({ id, ...b }) => GobiernoService.updateEvento(id, b).then(normalizeEvento),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => "Evento actualizado" },
  )

export const useCreateObra = () =>
  useGobMutation<{ eventoId: number; [k: string]: unknown }, unknown>(
    ({ eventoId, ...b }) => GobiernoService.createObra(eventoId, b),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => "Obra registrada" },
  )

export const useSetEspecies = () =>
  useGobMutation<{ eventoId: number; especies: unknown[] }, unknown>(
    ({ eventoId, especies }) => GobiernoService.setEspecies(eventoId, { especies }),
    { keys: [["gob", "eventos"], ["gob", "evento"]], success: () => "Tabla de aparición guardada" },
  )

export const useGrantRole = () =>
  useGobMutation<{ uuid: string; role: string }, unknown>(({ uuid, role }) => GobiernoService.grantRole(uuid, { role }), {
    keys: [["gob", "oficiales"]],
    success: () => "Nombramiento registrado",
  })

export const useRevokeRole = () =>
  useGobMutation<{ uuid: string; role: string }, unknown>(
    ({ uuid, role }) => GobiernoService.revokeRole(uuid, role),
    { keys: [["gob", "oficiales"]], success: () => "Cese registrado" },
  )

export const useUpsertNpcSkin = () =>
  useGobMutation<unknown, NpcSkin>((b) => GobiernoService.upsertNpcSkin(b), {
    keys: [["gob", "npc-skins"]],
    success: (s) => `Skin «${s.skin}» guardada`,
  })

export const useSendMegafonia = () =>
  useGobMutation<{ speaker: string; text: string }, unknown>((b) => GobiernoService.sendMegafonia(b), {
    keys: [["gob", "megafonia"]],
    success: () => "Mensaje emitido al servidor",
  })

export const useCreateCartel = () =>
  useGobMutation<unknown, Cartel>((b) => GobiernoService.createCartel(b), {
    keys: [["gob", "carteles"]],
    success: (c) => `Cartel «${c.name}» guardado`,
  })

export const useDeleteCartel = () =>
  useGobMutation<number, unknown>((id) => GobiernoService.deleteCartel(id), {
    keys: [["gob", "carteles"]],
    success: () => "Cartel eliminado",
  })
