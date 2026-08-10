"use client"
import { signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { Globe, Link as LinkIcon, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { env } from "@/config/env.public"

interface MinecraftAuthFormProps {
  mcUserData: { username?: string } | null
}

/**
 * The MCEF in-game surface shown when a Minecraft player has no linked BoffMedia
 * account. In-game linking is gone: it needs a FullSession the ingame MCEF token
 * cannot carry, and its old routes authenticated on the world string (shipped in
 * the browser bundle). Linking/registration now lives on the website behind
 * Microsoft, so this screen only points the player there — it never POSTs.
 */
export function MinecraftAuthForm({ mcUserData }: MinecraftAuthFormProps) {
  const t = useTranslations("smartrotom.auth")
  const site = (env.NEXT_PUBLIC_URL || "").replace(/\/$/, "")
  const siteLabel = site.replace(/^https?:\/\//, "") || "boffmedia.gg"

  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary-hover text-primary-active font-mono">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary-soft p-8 rounded-lg shadow-lg border-2 border-primary max-w-md w-full"
      >
        <div className="flex items-center mb-6">
          <LinkIcon className="w-8 h-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">{t("linkMovedTitle")}</h1>
        </div>

        {mcUserData?.username && (
          <div className="bg-primary-soft p-4 rounded mb-4">
            <p className="text-sm">
              {t("minecraftUser")} <span className="font-bold">{mcUserData.username}</span>
            </p>
          </div>
        )}

        <p className="text-sm mb-4 leading-relaxed">{t("linkMovedLead")}</p>

        <div className="flex items-center gap-2 bg-primary p-3 rounded mb-6 text-white">
          <Globe className="w-5 h-5 shrink-0" />
          <span className="font-bold break-all">{siteLabel}</span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/smartrotom" })}
          className="w-full flex items-center justify-center space-x-2 bg-layer-3 hover:bg-layer-3 text-white p-3 rounded transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("close")}</span>
        </button>
      </motion.div>
    </div>
  )
}
