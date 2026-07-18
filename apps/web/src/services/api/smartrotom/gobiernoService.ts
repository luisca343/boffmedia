import {
  rotomGETOrThrow as rotomGET,
  rotomAuthedPOSTOrThrow as rotomPOST,
  rotomAuthedPATCHOrThrow as rotomPATCH,
  rotomAuthedDELETEOrThrow as rotomDELETE,
} from "@/services/boffAPI"

// Transport for /smartrotom/gobierno. Every write here carries @UseGuards(JwtAuthGuard,
// RolesGuard), so it MUST go out authed — the plain rotom* helpers send no Bearer and 401.
// Gobierno writes are on the MinecraftMiddleware exclude list, but `server` rides along
// harmlessly since the DTOs extend BaseDto.
//
// The API is namespaced BY DEPARTMENT — `smartrotom/gobierno/urbanismo/zonas`, not
// `smartrotom/gobierno/zonas`. Only the cross-department reads (anuncios, auditoria,
// counters) sit at the bare root. These constants exist so a path can never drift again.
const URB = "/gobierno/urbanismo"
const SEG = "/gobierno/seguridad"
const HAC = "/gobierno/hacienda"
const JUS = "/gobierno/justicia"
const POB = "/gobierno/poblacion"
const ADM = "/gobierno/administracion"
const EVT = "/gobierno/eventos"

const qs = (params?: Record<string, string | number | boolean | undefined | null>): string => {
  if (!params) return ""
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (!entries.length) return ""
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`
}

type Query = Record<string, string | number | boolean | undefined | null>

const rid = (regionId: string) => encodeURIComponent(regionId)

export class GobiernoService {
  /** The four pending-work counts the sidebar badges read, in one call. */
  static counters = () => rotomGET<unknown>("/gobierno/counters")

  // ── Urbanismo ──────────────────────────────────────────────────────────────
  static zonas = (q?: Query) => rotomGET<unknown>(`${URB}/zonas${qs(q)}`)
  static createZona = (body: unknown) => rotomPOST<unknown>(`${URB}/zonas`, body)
  static updateZona = (id: number, body: unknown) => rotomPATCH<unknown>(`${URB}/zonas/${id}`, body)
  static deleteZona = (id: number) => rotomDELETE<unknown>(`${URB}/zonas/${id}`)

  static parcelas = (q?: Query) => rotomGET<unknown>(`${URB}/parcelas${qs(q)}`)
  static parcela = (regionId: string) => rotomGET<unknown>(`${URB}/parcelas/${rid(regionId)}`)
  static updateParcela = (regionId: string, body: unknown) =>
    rotomPATCH<unknown>(`${URB}/parcelas/${rid(regionId)}`, body)
  static parcelaHistorial = (regionId: string) => rotomGET<unknown>(`${URB}/parcelas/${rid(regionId)}/historial`)
  static addParcelaHistorial = (regionId: string, body: unknown) =>
    rotomPOST<unknown>(`${URB}/parcelas/${rid(regionId)}/historial`, body)
  /** The aggregate ownership-change register across every plot in Teras. */
  static historial = (q?: Query) => rotomGET<unknown>(`${URB}/historial${qs(q)}`)

  static subastas = (q?: Query) => rotomGET<unknown>(`${URB}/subastas${qs(q)}`)
  static createSubasta = (body: unknown) => rotomPOST<unknown>(`${URB}/subastas`, body)
  static updateSubasta = (id: number, body: unknown) => rotomPATCH<unknown>(`${URB}/subastas/${id}`, body)
  static puja = (id: number, body: unknown) => rotomPOST<unknown>(`${URB}/subastas/${id}/puja`, body)
  static closeSubasta = (id: number) => rotomPOST<unknown>(`${URB}/subastas/${id}/close`, {})

  // ── Seguridad ──────────────────────────────────────────────────────────────
  static denuncias = (q?: Query) => rotomGET<unknown>(`${SEG}/denuncias${qs(q)}`)
  static createDenuncia = (body: unknown) => rotomPOST<unknown>(`${SEG}/denuncias`, body)
  static updateDenuncia = (id: number, body: unknown) => rotomPATCH<unknown>(`${SEG}/denuncias/${id}`, body)
  static resolveDenuncia = (id: number, body: unknown) => rotomPATCH<unknown>(`${SEG}/denuncias/${id}/resolve`, body)

  static buscados = (q?: Query) => rotomGET<unknown>(`${SEG}/buscados${qs(q)}`)
  static createBuscado = (body: unknown) => rotomPOST<unknown>(`${SEG}/buscados`, body)
  static updateBuscado = (id: number, body: unknown) => rotomPATCH<unknown>(`${SEG}/buscados/${id}`, body)
  /** Pays the bounty out of the treasury to the captor — a real StarBank transfer. */
  static captureBuscado = (id: number, body: unknown) => rotomPOST<unknown>(`${SEG}/buscados/${id}/capture`, body)

  static patrullas = () => rotomGET<unknown>(`${SEG}/patrullas`)
  static createPatrulla = (body: unknown) => rotomPOST<unknown>(`${SEG}/patrullas`, body)
  static updatePatrulla = (id: number, body: unknown) => rotomPATCH<unknown>(`${SEG}/patrullas/${id}`, body)
  static deletePatrulla = (id: number) => rotomDELETE<unknown>(`${SEG}/patrullas/${id}`)
  static bitacora = (q?: Query) => rotomGET<unknown>(`${SEG}/bitacora${qs(q)}`)
  static addBitacora = (body: unknown) => rotomPOST<unknown>(`${SEG}/bitacora`, body)

  // ── Hacienda ───────────────────────────────────────────────────────────────
  static multas = (q?: Query) => rotomGET<unknown>(`${HAC}/multas${qs(q)}`)
  static createMulta = (body: unknown) => rotomPOST<unknown>(`${HAC}/multas`, body)
  /** Debits the citizen's StarBank account into the treasury. */
  static payMulta = (id: number) => rotomPOST<unknown>(`${HAC}/multas/${id}/pay`, {})
  static cancelMulta = (id: number, actorUuid: string) =>
    rotomPATCH<unknown>(`${HAC}/multas/${id}/cancel`, { actorUuid })

  static tasas = () => rotomGET<unknown>(`${HAC}/tasas`)
  static createTasa = (body: unknown) => rotomPOST<unknown>(`${HAC}/tasas`, body)
  static updateTasa = (id: number, body: unknown) => rotomPATCH<unknown>(`${HAC}/tasas/${id}`, body)
  static deleteTasa = (id: number) => rotomDELETE<unknown>(`${HAC}/tasas/${id}`)
  /** Wholly derived from the real StarBank ledger — nothing here is a stored figure. */
  static tesoreria = () => rotomGET<unknown>(`${HAC}/tesoreria`)

  // ── Justicia ───────────────────────────────────────────────────────────────
  static expedientes = (q?: Query) => rotomGET<unknown>(`${JUS}/expedientes${qs(q)}`)
  static expediente = (id: number) => rotomGET<unknown>(`${JUS}/expedientes/${id}`)
  static createExpediente = (body: unknown) => rotomPOST<unknown>(`${JUS}/expedientes`, body)
  static updateExpediente = (id: number, body: unknown) => rotomPATCH<unknown>(`${JUS}/expedientes/${id}`, body)
  static addExpedienteEvento = (id: number, body: unknown) =>
    rotomPOST<unknown>(`${JUS}/expedientes/${id}/eventos`, body)

  static apelaciones = (q?: Query) => rotomGET<unknown>(`${JUS}/apelaciones${qs(q)}`)
  static createApelacion = (body: unknown) => rotomPOST<unknown>(`${JUS}/apelaciones`, body)
  /** `overturned` refunds an already-paid fine out of the treasury. */
  static resolveApelacion = (id: number, body: unknown) => rotomPOST<unknown>(`${JUS}/apelaciones/${id}/resolve`, body)

  // ── Población ──────────────────────────────────────────────────────────────
  static censo = (q?: Query) => rotomGET<unknown>(`${POB}/censo${qs(q)}`)
  static ciudadano = (uuid: string) => rotomGET<unknown>(`${POB}/censo/${uuid}`)
  static oficiales = () => rotomGET<unknown>(`${POB}/oficiales`)
  static grantRole = (uuid: string, body: unknown) => rotomPOST<unknown>(`${POB}/oficiales/${uuid}/roles`, body)
  static revokeRole = (uuid: string, role: string) => rotomDELETE<unknown>(`${POB}/oficiales/${uuid}/roles/${role}`)

  // ── Gobierno (cross-department reads live at the root) ──────────────────────
  static anuncios = (q?: Query) => rotomGET<unknown>(`/gobierno/anuncios${qs(q)}`)
  static createAnuncio = (body: unknown) => rotomPOST<unknown>("/gobierno/anuncios", body)
  static updateAnuncio = (id: number, body: unknown) => rotomPATCH<unknown>(`/gobierno/anuncios/${id}`, body)
  static deleteAnuncio = (id: number) => rotomDELETE<unknown>(`/gobierno/anuncios/${id}`)
  static auditoria = (q?: Query) => rotomGET<unknown>(`/gobierno/auditoria${qs(q)}`)

  // ── Eventos ────────────────────────────────────────────────────────────────
  static eventos = (q?: Query) => rotomGET<unknown>(`${EVT}${qs(q)}`)
  static evento = (id: number) => rotomGET<unknown>(`${EVT}/${id}`)
  static createEvento = (body: unknown) => rotomPOST<unknown>(EVT, body)
  static updateEvento = (id: number, body: unknown) => rotomPATCH<unknown>(`${EVT}/${id}`, body)
  static deleteEvento = (id: number) => rotomDELETE<unknown>(`${EVT}/${id}`)

  static obras = (eventoId: number) => rotomGET<unknown>(`${EVT}/${eventoId}/obras`)
  static createObra = (eventoId: number, body: unknown) => rotomPOST<unknown>(`${EVT}/${eventoId}/obras`, body)
  static updateObra = (obraId: number, body: unknown) => rotomPATCH<unknown>(`${EVT}/obras/${obraId}`, body)
  static deleteObra = (obraId: number) => rotomDELETE<unknown>(`${EVT}/obras/${obraId}`)

  static especies = (eventoId: number) => rotomGET<unknown>(`${EVT}/${eventoId}/especies`)
  static setEspecies = (eventoId: number, body: unknown) => rotomPOST<unknown>(`${EVT}/${eventoId}/especies`, body)
  static deleteEspecie = (especieId: number) => rotomDELETE<unknown>(`${EVT}/especies/${especieId}`)
  /** A hunt is blind: this only answers once the event has closed. */
  static capturas = (eventoId: number) => rotomGET<unknown>(`${EVT}/${eventoId}/capturas`)

  // ── Administración ─────────────────────────────────────────────────────────
  static npcSkins = () => rotomGET<unknown>(`${ADM}/npc-skins`)
  static upsertNpcSkin = (body: unknown) => rotomPOST<unknown>(`${ADM}/npc-skins`, body)
  static updateNpcSkin = (skin: string, body: unknown) =>
    rotomPATCH<unknown>(`${ADM}/npc-skins/${encodeURIComponent(skin)}`, body)
  static deleteNpcSkin = (skin: string) => rotomDELETE<unknown>(`${ADM}/npc-skins/${encodeURIComponent(skin)}`)

  static megafonia = (q?: Query) => rotomGET<unknown>(`${ADM}/megafonia${qs(q)}`)
  /** Posts to in-game global chat AND records who said it as whom. */
  static sendMegafonia = (body: unknown) => rotomPOST<unknown>(`${ADM}/megafonia/send`, body)

  static carteles = () => rotomGET<unknown>(`${ADM}/carteles`)
  static createCartel = (body: unknown) => rotomPOST<unknown>(`${ADM}/carteles`, body)
  static updateCartel = (id: number, body: unknown) => rotomPATCH<unknown>(`${ADM}/carteles/${id}`, body)
  static deleteCartel = (id: number) => rotomDELETE<unknown>(`${ADM}/carteles/${id}`)
}
