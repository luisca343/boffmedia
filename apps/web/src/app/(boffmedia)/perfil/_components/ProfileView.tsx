"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Empty, Icon, Panel, Spinner, toast } from "@/components/boffmedia/primitives"
import {
  AccountForm,
  LinkedAccounts,
  LinkedAccountRow,
  ProfileHero,
  type AccountFormValues,
} from "@/components/boffmedia/ui/profile"
import { useBoffSession } from "@/services/useBoffSession"
import { UsersService } from "@/services/api/boffmedia/usersService"
import { UploadService } from "@/services/api/smartrotom/uploadService"

type FullUser = NonNullable<Awaited<ReturnType<typeof UsersService.getUser>>["data"]>

export function ProfileView() {
  const t = useTranslations("profile")
  const { session, status, refreshSession } = useBoffSession()
  const user = session?.user

  const [full, setFull] = React.useState<FullUser | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [values, setValues] = React.useState<AccountFormValues>({ name: "", email: "" })
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (user) setValues({ name: user.name ?? "", email: user.email ?? "" })
  }, [user?.name, user?.email])

  React.useEffect(() => {
    if (!user?.id) return
    let alive = true
    UsersService.getUser(Number(user.id))
      .then((res) => {
        if (alive && res.data) setFull(res.data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user?.id])

  async function handleSave() {
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await UsersService.updateUser(Number(user.id), {
        username: values.name,
        email: values.email,
      } as never)
      if (res.success) {
        await refreshSession()
        toast.success(t("saved"))
        setEditing(false)
      } else {
        toast.error(res.error || t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const up = await UploadService.uploadProfileImage(file, String(user?.id ?? "default"))
      if (!up.data?.url) {
        toast.error(t("avatar.error"))
        return
      }
      await UsersService.updateUser(Number(user?.id), { profilePicture: up.data.url } as never)
      await refreshSession()
      toast.success(t("saved"))
    } catch {
      toast.error(t("avatar.error"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  if (status === "loading") {
    return (
      <main data-ds="boffmedia" className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!user) {
    return (
      <main data-ds="boffmedia" className="wrap">
        <Empty icon="user" title={t("loggedOut.title")} lead={t("loggedOut.body")}>
          <Button variant="pri" icon="user" href="/entrar">
            {t("loggedOut.cta")}
          </Button>
        </Empty>
      </main>
    )
  }

  const initial = (user.name || "U").charAt(0).toUpperCase()
  const year = full?.createdAt ? new Date(full.createdAt).getFullYear() : null
  const mcLinked = !!user.smartRotomUser?.uuid

  const handle = (
    <>
      @<b>{user.name}</b>
      {year != null && <> · {t("memberSince", { year })}</>}
    </>
  )

  const tags = (
    <>
      {(user.roles ?? []).map((r) => (
        <Badge key={r} tone="new">
          {r}
        </Badge>
      ))}
      {mcLinked && <Badge tone="live">Minecraft</Badge>}
    </>
  )

  const linkEnd = (linked: boolean) =>
    linked ? (
      <Badge tone="ok">{t("linked.linked")}</Badge>
    ) : (
      <Button size="sm" disabled title={t("linked.soon")} icon="link">
        {t("linked.link")}
      </Button>
    )

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-[34px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-[22px]">
        <div>
          <span className="mono-label">{t("kicker")}</span>
          <h1 className="mt-2 text-[clamp(46px,5.4vw,64px)]">{t("title")}</h1>
        </div>
        <Button
          variant={editing ? "pri" : "default"}
          icon={editing ? "check" : "cog"}
          loading={saving}
          onClick={editing ? handleSave : () => setEditing(true)}
        >
          {editing ? t("save") : t("edit")}
        </Button>
      </div>

      <ProfileHero
        name={user.name || "—"}
        handle={handle}
        initial={initial}
        avatarUrl={user.image ?? full?.profilePicture}
        tags={tags}
        editable
        uploading={uploading}
        avatarLabel={t("avatar.change")}
        onAvatarClick={() => !uploading && fileRef.current?.click()}
        onCoverClick={() => !uploading && fileRef.current?.click()}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="grid items-start gap-4 [grid-template-columns:1.05fr_0.95fr] max-[1080px]:grid-cols-1">
        <Panel title={t("section.account")}>
          <AccountForm
            values={values}
            editing={editing}
            onChange={(f, v) => setValues((prev) => ({ ...prev, [f]: v }))}
          />
        </Panel>

        <Panel title={t("section.linked")}>
          <LinkedAccounts>
            <LinkedAccountRow
              icon="google"
              name="Google"
              hue="#ea4335"
              linked={!!full?.googleId}
              sub={full?.googleId ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(!!full?.googleId)}
            />
            <LinkedAccountRow
              icon="discord"
              name="Discord"
              hue="#5865F2"
              linked={!!full?.discordId}
              sub={full?.discordId ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(!!full?.discordId)}
            />
            <LinkedAccountRow
              icon="gamepad"
              name="Minecraft"
              hue="#3fbf5f"
              linked={mcLinked}
              sub={mcLinked ? (user.smartRotomUser?.username ?? t("linked.linked")) : t("linked.unlinked")}
              end={linkEnd(mcLinked)}
            />
          </LinkedAccounts>
        </Panel>
      </div>
    </main>
  )
}
