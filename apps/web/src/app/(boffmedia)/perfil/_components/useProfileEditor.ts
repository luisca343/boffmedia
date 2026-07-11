"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@/components/boffmedia/primitives"
import { type AccountFormValues } from "@/components/boffmedia/ui/profile"
import { UsersService } from "@/services/api/boffmedia/usersService"
import { UploadService } from "@/services/api/smartrotom/uploadService"

export type FullUser = NonNullable<Awaited<ReturnType<typeof UsersService.getUser>>["data"]>

const OK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_MB = 5

type EditorUser = { name?: string | null; email?: string | null } | null | undefined

export function useProfileEditor({
  userId,
  user,
  update,
}: {
  userId: number | null
  user: EditorUser
  update: () => Promise<unknown>
}) {
  const t = useTranslations("profile")

  const [full, setFull] = React.useState<FullUser | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [coverUploading, setCoverUploading] = React.useState(false)
  const [avatarOverride, setAvatarOverride] = React.useState<string | null>(null)
  const [coverOverride, setCoverOverride] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<AccountFormValues>({ name: "", email: "", bio: "" })
  const fileRef = React.useRef<HTMLInputElement>(null)
  const coverRef = React.useRef<HTMLInputElement>(null)

  const loadFull = React.useCallback(() => {
    if (!userId) return
    UsersService.getUser(userId)
      .then((res) => {
        if (res.data) setFull(res.data)
      })
      .catch((err) => console.error("[perfil] failed to load full profile", err))
  }, [userId])

  React.useEffect(() => {
    loadFull()
  }, [loadFull])

  // Toast the result of a provider link round-trip. The Steam/Discord callbacks
  // redirect back to /perfil?linked=<p> or ?linked_error=<p>[_taken]; strip the
  // query afterwards so a refresh doesn't re-fire it.
  const linkQueryHandled = React.useRef(false)
  React.useEffect(() => {
    if (linkQueryHandled.current) return
    const sp = new URLSearchParams(window.location.search)
    const linked = sp.get("linked")
    const err = sp.get("linked_error")
    if (!linked && !err) return
    linkQueryHandled.current = true
    if (linked === "steam") {
      toast.success(t("linked.steamLinked"))
      loadFull()
    } else if (linked === "discord") {
      toast.success(t("linked.discordLinked"))
      loadFull()
    } else if (linked === "google") {
      toast.success(t("linked.googleLinked"))
      loadFull()
    } else if (linked === "twitch") {
      toast.success(t("linked.twitchLinked"))
      loadFull()
    } else if (err === "steam_taken") {
      toast.error(t("linked.steamTaken"))
    } else if (err === "discord_taken") {
      toast.error(t("linked.discordTaken"))
    } else if (err === "google_taken") {
      toast.error(t("linked.googleTaken"))
    } else if (err === "twitch_taken") {
      toast.error(t("linked.twitchTaken"))
    } else if (err === "discord") {
      toast.error(t("linked.discordError"))
    } else if (err === "google") {
      toast.error(t("linked.googleError"))
    } else if (err === "twitch") {
      toast.error(t("linked.twitchError"))
    } else if (err) {
      toast.error(t("linked.steamError"))
    }
    window.history.replaceState(null, "", window.location.pathname)
  }, [t, loadFull])

  React.useEffect(() => {
    if (user) {
      setValues({ name: user.name ?? "", email: user.email ?? "", bio: full?.bio ?? "" })
    }
  }, [user?.name, user?.email, full?.bio])

  function validateImage(file: File): string | null {
    if (!OK_IMAGE_TYPES.includes(file.type)) return t("avatar.badType")
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return t("avatar.tooBig", { mb: MAX_IMAGE_MB })
    return null
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    try {
      const res = await UsersService.updateUser(userId, {
        username: values.name,
        email: values.email,
        bio: values.bio ?? "",
      } as never)
      if (res.success) {
        setFull((prev) => (prev ? { ...prev, bio: values.bio ?? prev.bio } : prev))
        try {
          await update()
        } catch (err) {
          console.error("[perfil] session refresh after save failed", err)
        }
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
    if (!file || !userId) return
    const invalid = validateImage(file)
    if (invalid) {
      toast.error(invalid)
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    setUploading(true)
    try {
      const up = await UploadService.uploadProfileImage(file, String(userId))
      if (!up.data?.url) {
        toast.error(t("avatar.error"))
        return
      }
      const url = up.data.url
      setAvatarOverride(url) // optimistic — no page reload
      const res = await UsersService.updateUser(userId, { profilePicture: url } as never)
      if (!res.success) {
        setAvatarOverride(null)
        toast.error(res.error || t("avatar.error"))
        return
      }
      setFull((prev) => (prev ? { ...prev, profilePicture: url } : prev))
      try {
        await update() // refresh session (navbar avatar) in place, no reload
      } catch (err) {
        console.error("[perfil] session refresh after avatar update failed", err)
      }
      toast.success(t("avatar.updated"))
    } catch {
      toast.error(t("avatar.error"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const invalid = validateImage(file)
    if (invalid) {
      toast.error(invalid)
      if (coverRef.current) coverRef.current.value = ""
      return
    }
    setCoverUploading(true)
    try {
      const up = await UploadService.uploadCoverImage(file, String(userId))
      if (!up.data?.url) {
        toast.error(t("cover.error"))
        return
      }
      const url = up.data.url
      setCoverOverride(url) // optimistic — no page reload
      const res = await UsersService.updateUser(userId, { coverImage: url } as never)
      if (!res.success) {
        setCoverOverride(null)
        toast.error(res.error || t("cover.error"))
        return
      }
      setFull((prev) => (prev ? { ...prev, coverImage: url } : prev))
      toast.success(t("cover.updated"))
    } catch {
      toast.error(t("cover.error"))
    } finally {
      setCoverUploading(false)
      if (coverRef.current) coverRef.current.value = ""
    }
  }

  async function handleUnlink(provider: "google" | "discord" | "steam" | "twitch") {
    if (!userId) return
    try {
      const res = await UsersService.unlinkProvider(userId, provider)
      if (res.success) {
        loadFull()
        try {
          await update()
        } catch (err) {
          console.error("[perfil] session refresh after unlink failed", err)
        }
        toast.success(t("linked.unlinkedDone"))
      } else {
        toast.error(res.error || t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    }
  }

  return {
    full,
    editing,
    setEditing,
    saving,
    uploading,
    coverUploading,
    avatarOverride,
    coverOverride,
    values,
    setValues,
    fileRef,
    coverRef,
    handleSave,
    handleFile,
    handleCoverFile,
    handleUnlink,
  }
}
