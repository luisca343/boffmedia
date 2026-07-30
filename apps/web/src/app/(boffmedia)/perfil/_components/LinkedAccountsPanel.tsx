"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Panel } from "@boffmedia/ui"
import { LinkedAccounts, LinkedAccountRow } from "@/components/boffmedia/ui/profile"

type Provider = "google" | "discord" | "steam" | "twitch"

export function LinkedAccountsPanel({
  googleId,
  discordId,
  steamLinked,
  twitchLinked,
  mcLinked,
  mcUsername,
  editing,
  discordEnabled,
  twitchEnabled,
  onUnlink,
}: {
  googleId?: string | null
  discordId?: string | null
  steamLinked: boolean
  twitchLinked: boolean
  mcLinked: boolean
  mcUsername?: string | null
  editing: boolean
  discordEnabled: boolean
  twitchEnabled: boolean
  onUnlink: (provider: Provider) => void
}) {
  const t = useTranslations("profile")

  const linkEnd = (linked: boolean, provider?: Provider) => {
    if (linked) {
      if (editing && provider) {
        return (
          <Button size="sm" variant="ghost" icon="x" onClick={() => onUnlink(provider)}>
            {t("linked.unlink")}
          </Button>
        )
      }
      return <Badge tone="ok">{t("linked.linked")}</Badge>
    }
    // Steam/Google always link via their flow; Discord only when the app is
    // configured. A full navigation (not client-nav) is required so the route's
    // redirect to the provider is followed by the browser.
    const linkHref =
      provider === "steam"
        ? "/api/steam/link"
        : provider === "google"
          ? "/api/google/link"
          : provider === "discord" && discordEnabled
            ? "/api/discord/link"
            : provider === "twitch" && twitchEnabled
              ? "/api/twitch/link"
              : null
    if (linkHref) {
      return (
        <Button
          size="sm"
          icon="link"
          onClick={() => {
            window.location.href = linkHref
          }}
        >
          {t("linked.link")}
        </Button>
      )
    }
    return (
      <Button size="sm" disabled title={t("linked.soon")} icon="link">
        {t("linked.link")}
      </Button>
    )
  }

  return (
    <Panel title={t("section.linked")}>
      <LinkedAccounts>
        <LinkedAccountRow
          icon="google"
          name="Google"
          hue="#ea4335"
          linked={!!googleId}
          sub={googleId ? t("linked.linked") : t("linked.unlinked")}
          end={linkEnd(!!googleId, "google")}
        />
        <LinkedAccountRow
          icon="discord"
          name="Discord"
          hue="#5865F2"
          linked={!!discordId}
          sub={discordId ? t("linked.linked") : t("linked.unlinked")}
          end={linkEnd(!!discordId, "discord")}
        />
        <LinkedAccountRow
          icon="steam"
          name="Steam"
          hue="#66c0f4"
          linked={steamLinked}
          sub={steamLinked ? t("linked.linked") : t("linked.unlinked")}
          end={linkEnd(steamLinked, "steam")}
        />
        <LinkedAccountRow
          icon="twitch"
          name="Twitch"
          hue="#9146FF"
          linked={twitchLinked}
          sub={twitchLinked ? t("linked.linked") : t("linked.unlinked")}
          end={linkEnd(twitchLinked, "twitch")}
        />
        <LinkedAccountRow
          icon="gamepad"
          name="Minecraft"
          hue="#3fbf5f"
          linked={mcLinked}
          sub={mcLinked ? (mcUsername ?? t("linked.linked")) : t("linked.unlinked")}
          end={mcLinked ? <Badge tone="ok">{t("linked.linked")}</Badge> : linkEnd(false)}
        />
      </LinkedAccounts>
    </Panel>
  )
}
