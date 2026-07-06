"use client"

import { useState, useRef, useEffect } from "react"
import { BoffButton as Button } from "@/components/boffmedia-v2/primitives/button"
import { BoffInput as Input } from "@/components/boffmedia-v2/primitives/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar"
import { Icon } from "@/components/boffmedia-v2/primitives/icon"
import { BoffCard as Card } from "@/components/boffmedia-v2/primitives/card"
import { BoffBadge as Badge } from "@/components/boffmedia-v2/primitives/badge"
import { Kicker } from "@/components/boffmedia-v2/primitives/kicker"
import { Field } from "@/components/boffmedia-v2/primitives/field"
import { CardTitle } from "@/components/boffmedia-v2/ui/profile/card-title"
import { Metric } from "@/components/boffmedia-v2/ui/profile/metric"
import { LinkedRow } from "@/components/boffmedia-v2/ui/profile/linked-row"
import { ActivityItem } from "@/components/boffmedia-v2/ui/profile/activity-item"
import { AchievementTile } from "@/components/boffmedia-v2/ui/profile/achievement-tile"
import { StatCard } from "@/components/boffmedia-v2/ui/profile/stat-card"
import useSocketStore from "@/stores/useSocketStore"
import { useBoffSession } from "@/services/useBoffSession"
import { UploadService } from "@/services/api/smartrotom/uploadService"
import { UsersService } from "@/services/api/boffmedia/usersService"
import { cn } from "@/lib/utils"

// ─── Mock data (handoff-pixel-perfect; user will wire real data) ──────────────
const PROFILE_STATS = [
  { icon: "trophy", label: "Ranking global", value: "#42", sub: "Top 1%" },
  { icon: "bolt", label: "Puntos", value: "4 180", sub: "+210 esta semana" },
  { icon: "chart", label: "Victorias", value: "73%", sub: "128 partidas" },
  { icon: "star", label: "Logros", value: "37", sub: "de 60" },
]

const ACHIEVEMENTS = [
  { icon: "trophy", name: "Campeón Regional", done: true },
  { icon: "zap", name: "Racha de 10", done: true },
  { icon: "calc", name: "Maestro del cálculo", done: true },
  { icon: "sword", name: "Cazador veterano", done: true },
  { icon: "cards", name: "Coleccionista TCG", done: false },
  { icon: "flask", name: "Pionero del sim", done: false },
]

const ACTIVITY = [
  { icon: "trophy", text: "Quedó 2º en VGC Regional — Series 2", time: "hace 2 días", color: "var(--orange-500)" },
  { icon: "calc", text: "Guardó 3 sets en la Calculadora de Daño", time: "hace 4 días", color: "var(--secondary-hover)" },
  { icon: "users", text: "Se unió al equipo «Rotom Squad»", time: "hace 1 semana", color: "var(--purple-400)" },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function UserProfile() {
  const { session, refreshSession } = useBoffSession()
  const socket = useSocketStore((state) => state.socket)
  const user = session?.user

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user || {})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) setEditedUser(user)
  }, [user])

  const handleSave = () => {
    console.log("Saving user data:", editedUser)
    setIsEditing(false)
  }

  const handleImageClick = () => {
    if (!isUploading) fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setIsUploading(true)
    try {
      const uploadResponse = await UploadService.uploadProfileImage(file, user?.id || "default")
      if (!uploadResponse.data?.url) {
        setUploadError("Upload failed: No response data")
        return
      }
      const imageUrl = uploadResponse.data.url
      await UsersService.updateUser(Number(user?.id), { profilePicture: imageUrl } as any)
      setEditedUser((prev) => ({ ...prev, image: imageUrl }))
      await refreshSession()
    } catch (err) {
      setUploadError("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const initial = (editedUser.name || "U").charAt(0).toUpperCase()

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="relative container mx-auto px-4 py-16 z-10 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <Card style={{ padding: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
              <span
                className="w-16 h-16 rounded-full grid place-items-center"
                style={{
                  background: "color-mix(in srgb, var(--orange-500) 12%, transparent)",
                  border: "var(--hairline) solid color-mix(in srgb, var(--orange-500) 30%, transparent)",
                }}
              >
                <Icon name="user" size={28} className="text-[var(--orange-500)]" />
              </span>
              <div>
                <h2 className="text-[length:var(--t-xl)] mb-1">Acceso Requerido</h2>
                <p className="text-[length:var(--t-sm)] text-ink-muted">
                  Inicia sesión para ver tu perfil.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ── Logged in ──────────────────────────────────────────────────────────────

  const userRoles = user.roles?.join(", ") || "Usuario"

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="relative container mx-auto px-4 z-10 py-16">
        <div className="max-w-4xl mx-auto">

          {/* ── Page head ─────────────────────────────────────────────────── */}
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div>
              <Kicker>Cuenta</Kicker>
              <h1 className="text-[length:var(--t-4xl)] mt-[0.7rem] text-pretty">Mi perfil</h1>
            </div>
            <Button
              variant={isEditing ? "primary" : "ghost"}
              icon={isEditing ? "check" : "cog"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? "Guardar cambios" : "Editar perfil"}
            </Button>
          </div>

          {/* ── Identity card ─────────────────────────────────────────────── */}
          <Card ticks className="overflow-hidden mb-6">
            {/* Cover */}
            <div
              className="h-[104px]"
              style={{
                background: "color-mix(in srgb, var(--orange-500) 14%, var(--layer-2))",
                borderBottom: "var(--hairline) solid var(--border)",
                backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            {/* Main row */}
            <div className="flex items-end gap-[1.5rem_1.75rem] flex-wrap p-[1.4rem_1.75rem_1.75rem]">
              {/* Avatar */}
              <div className="relative w-[110px] h-[110px] shrink-0 -mt-[74px]">
                <div
                  className="p-[2px] rounded-full cursor-pointer group"
                  onClick={handleImageClick}
                  style={{
                    background: "linear-gradient(135deg, var(--orange-500), var(--orange-700))",
                    boxShadow: "0 10px 30px -10px var(--orange-500)",
                  }}
                >
                  <div className="p-0.5 rounded-full" style={{ background: "var(--layer-1)" }}>
                    <Avatar className="w-[106px] h-[106px]">
                      <AvatarImage
                        src={editedUser.image || user?.image || "/placeholder.svg?height=110&width=110"}
                        alt={editedUser.name || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className="text-3xl font-black"
                        style={{ background: "color-mix(in srgb, var(--orange-500) 15%, var(--layer-2))", color: "var(--orange-500)" }}
                      >
                        {initial}
                      </AvatarFallback>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <Icon name="camera" size={24} className="text-white" />
                      </div>

                      {/* Upload spinner */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                          <Icon name="bolt" size={24} className="text-white animate-spin" />
                        </div>
                      )}
                    </Avatar>
                  </div>
                </div>

                {/* Camera button (handoff position) */}
                <button
                  onClick={handleImageClick}
                  disabled={isUploading}
                  aria-label="Cambiar foto"
                  className="absolute bottom-[2px] right-[2px] w-[30px] h-[30px] rounded-full grid place-items-center cursor-pointer z-10 transition-colors duration-[var(--dur)]"
                  style={{
                    color: "var(--text)",
                    background: "var(--layer-1)",
                    border: "var(--hairline) solid var(--border-strong)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--orange-500)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--orange-500)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)" }}
                >
                  <Icon name="camera" size={16} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {uploadError && (
                  <p className="absolute -bottom-6 left-0 right-0 text-[length:var(--t-xs)] text-[var(--rose-400)] text-center">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-[220px] pb-[0.3rem]">
                <div className="flex items-center gap-[0.75rem] flex-wrap">
                  <h2 className="text-[length:var(--t-2xl)] whitespace-nowrap">
                    {editedUser.name || "Anonymous"}
                  </h2>
                  <Badge kind={socket ? "live" : undefined}>
                    {socket ? "Online" : "Offline"}
                  </Badge>
                </div>
                <p className="text-ink-muted text-[length:var(--t-sm)] mt-[0.35rem] mb-[0.75rem]">
                  @{editedUser.email?.split("@")[0] || "usuario"} · Miembro desde 2023
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge kind="accent">{userRoles}</Badge>
                  {user.mcUuid || user.smartRotomUser?.uuid ? (
                    <Badge kind="live">Minecraft</Badge>
                  ) : null}
                </div>
              </div>

              {/* Quick stats (mirrors handoff hero Metric qdiv Metric) */}
              <div className="flex items-center gap-5 pb-2 max-[600px]:w-full max-[600px]:justify-start max-[600px]:pt-2">
                <Metric value="#42" label="Ranking" size="sm" tone="orange" mono />
                <div className="w-px h-[38px]" style={{ background: "var(--border-strong)" }} />
                <Metric value="4 180" label="Puntos" size="sm" tone="orange" mono />
              </div>
            </div>
          </Card>

          {/* ── Two-column grid ────────────────────────────────────────────── */}
          <div className="grid gap-6 items-start [grid-template-columns:1.2fr_1fr] max-[1000px]:grid-cols-1">
            {/* ── LEFT column ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Account details */}
              <Card style={{ padding: "1.5rem" }}>
                <CardTitle icon="user">Datos de la cuenta</CardTitle>
                <div className="grid grid-cols-2 gap-[1.1rem] max-[600px]:grid-cols-1">
                  <Field label="Nombre" icon="user">
                    <Input
                      id="name"
                      type="text"
                      value={editedUser.name || ""}
                      onChange={(e) => setEditedUser((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </Field>
                  <Field label="Correo" icon="mail">
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email || ""}
                      onChange={(e) => setEditedUser((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </Field>
                  <Field label="Biografía" icon="message" className="col-span-full">
                    <textarea
                      className={cn(
                        "w-full font-body text-sm text-ink",
                        "bg-layer-2 border border-solid border-edge-strong",
                        "rounded-[var(--btn-radius,9999px)]",
                        "py-2.5 px-3.5",
                        "transition-[border-color,box-shadow] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
                        "placeholder:text-ink-dim",
                        "focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]",
                        "disabled:opacity-55 disabled:cursor-not-allowed",
                        "resize-y leading-[1.6]",
                      )}
                      rows={3}
                      disabled={!isEditing}
                      defaultValue="Entrenador competitivo de VGC y cazador a tiempo parcial. Construyendo herramientas para la comunidad."
                    />
                  </Field>
                </div>
              </Card>

              {/* Linked accounts */}
              <Card style={{ padding: "1.5rem" }}>
                <CardTitle icon="link">Cuentas vinculadas</CardTitle>
                <div className="flex flex-col gap-3">
                  <LinkedRow
                    icon="discord"
                    iconClass="discord"
                    name="Discord"
                    sub={!!(editedUser as any).discordId ? "Vinculado" : "Sin vincular"}
                    end={
                      !!(editedUser as any).discordId ? (
                        <Badge kind="live">Vinculado</Badge>
                      ) : (
                        <Button variant="outline" size="sm" icon="link">
                          Vincular
                        </Button>
                      )
                    }
                  />
                  <LinkedRow
                    icon="gamepad"
                    iconClass="mc"
                    name="Minecraft"
                    sub={user.mcUuid || user.smartRotomUser?.uuid ? "Vinculado" : "Sin vincular"}
                    end={
                      user.mcUuid || user.smartRotomUser?.uuid ? (
                        <Badge kind="live">Vinculado</Badge>
                      ) : (
                        <Button variant="outline" size="sm" icon="link">
                          Vincular
                        </Button>
                      )
                    }
                  />
                  <LinkedRow
                    icon="gamepad"
                    iconClass="steam"
                    name="Showdown"
                    sub={!!(editedUser as any).showdownUser ? "RotomChef" : "Sin vincular"}
                    end={
                      !!(editedUser as any).showdownUser ? (
                        <Badge kind="live">Vinculado</Badge>
                      ) : (
                        <Button variant="outline" size="sm" icon="link">
                          Vincular
                        </Button>
                      )
                    }
                  />
                </div>
              </Card>

              {/* Recent activity */}
              <Card style={{ padding: "1.5rem" }}>
                <CardTitle icon="bell">Actividad reciente</CardTitle>
                <ul className="list-none m-0 p-0 flex flex-col">
                  {ACTIVITY.map((a, i) => (
                    <ActivityItem key={i} icon={a.icon} text={a.text} time={a.time} color={a.color} />
                  ))}
                </ul>
              </Card>
            </div>

            {/* ── RIGHT column ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Statistics */}
              <Card style={{ padding: "1.5rem" }}>
                <CardTitle icon="chart">Estadísticas</CardTitle>
                <div className="grid grid-cols-2 gap-[0.9rem] max-[600px]:grid-cols-1">
                  {PROFILE_STATS.map((s) => (
                    <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} sub={s.sub} />
                  ))}
                </div>
              </Card>

              {/* Achievements */}
              <Card style={{ padding: "1.5rem" }}>
                <CardTitle
                  icon="star"
                  right={
                    <span
                      className="text-ink-dim"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)" }}
                    >
                      37 / 60
                    </span>
                  }
                >
                  Logros
                </CardTitle>
                <div className="grid grid-cols-3 gap-[0.75rem] mb-5 max-[600px]:grid-cols-2">
                  {ACHIEVEMENTS.map((a) => (
                    <AchievementTile key={a.name} icon={a.icon} name={a.name} done={a.done} />
                  ))}
                </div>
                <Button variant="ghost" block iconRight="arrow">
                  Ver todos los logros
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
