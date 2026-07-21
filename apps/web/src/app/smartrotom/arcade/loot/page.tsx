"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { OpenLootBoxResponseDto } from "@boffmedia/shared"
import { userMessageFrom } from "@/services/boffAPI"
import {
  useArcadeInventory,
  useArcadeUuid,
  useLootboxConfig,
  useOpenLootbox,
} from "../_hooks/queries"
import {
  boxAccent,
  ownedBoxes,
  resolveBoxes,
  totalBoxesOwned,
  type ResolvedBox,
} from "../_utils/inventory"
import {
  Button,
  Icon,
  Panel,
  SectionTitle,
  Skeleton,
  Tag,
  type ArAccent,
} from "../_components/ui"
import { BoxCarousel } from "./_components/BoxCarousel"
import { BoxOddsPanel } from "./_components/BoxOddsPanel"
import { LootInfoModal } from "./_components/LootInfoModal"
import { OpeningStage } from "./_components/OpeningStage"

interface OpenSession {
  /** Bumped per open so back-to-back rolls remount the reel instead of reusing it. */
  nonce: number
  box: ResolvedBox
  result: OpenLootBoxResponseDto
}

// SectionTitle has no lime accent, so the green box borrows the system cyan.
const TITLE_ACCENT: Record<string, ArAccent> = {
  cyan: "cyan",
  lime: "cyan",
  magenta: "magenta",
  violet: "violet",
  amber: "amber",
}

export default function LootPage() {
  const t = useTranslations("")
  const uuid = useArcadeUuid()
  const config = useLootboxConfig()
  const inventory = useArcadeInventory()
  const openBox = useOpenLootbox()

  const [index, setIndex] = useState(0)
  const [info, setInfo] = useState(false)
  const [session, setSession] = useState<OpenSession | null>(null)

  const boxes = resolveBoxes(config.data)
  const owned = ownedBoxes(inventory.data, boxes)
  const total = totalBoxesOwned(owned)
  const box: ResolvedBox | undefined = boxes[Math.min(index, Math.max(boxes.length - 1, 0))]

  const open = async (target: ResolvedBox) => {
    try {
      const result = await openBox.mutateAsync(target.id)
      setSession((prev) => ({ nonce: (prev?.nonce ?? 0) + 1, box: target, result }))
    } catch {
      // `openBox.isError` renders the failure; a rejected promise must not bubble.
    }
  }

  if (config.isLoading || inventory.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[68px] rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[380px] rounded-2xl" />
          <Skeleton className="h-[380px] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (config.isError || boxes.length === 0) {
    return (
      <Panel tone="deep">
        <p role="alert" className="font-ar-mono text-[12px] text-ar-danger">
          {t("arcade.loot.noBoxesLoaded")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          icon={<Icon.Reset s={12} />}
          onClick={() => void config.refetch()}
        >
          {t("arcade.common.retry")}
        </Button>
      </Panel>
    )
  }

  if (session) {
    return (
      <OpeningStage
        key={session.nonce}
        box={session.box}
        result={session.result}
        owned={owned[session.box.id] ?? 0}
        opening={openBox.isPending}
        onOpenAnother={() => void open(session.box)}
        onBack={() => setSession(null)}
      />
    )
  }

  return (
    <>
      <Panel tone="deep" tight className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <Link
              href="/smartrotom/arcade"
              className="ar-lift inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em] text-ar-ink-dim hover:text-ar-ink"
            >
              <Icon.Chevron s={12} dir="left" /> {t("arcade.sidebar.arcade")}
            </Link>
            <span className="ar-chrom font-ar-display text-[15px] text-ar-ink">{t("arcade.loot.title")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {total === 0 ? (
              <Tag tone="ghost" size="md">
                {t("arcade.loot.noBoxes")}
              </Tag>
            ) : (
              boxes
                .filter((b) => (owned[b.id] ?? 0) > 0)
                .map((b) => (
                  <Tag key={b.id} tone={boxAccent(b.theme)} size="md">
                    {owned[b.id]}× {b.name}
                  </Tag>
                ))
            )}
            <Link
              href="/smartrotom/arcade/coleccion"
              className="ar-lift inline-flex items-center gap-2 rounded-lg border border-ar-cyan/45 px-3 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em] text-ar-cyan shadow-[inset_0_0_20px_rgb(var(--ar-cyan)/.08)]"
            >
              <Icon.Grid s={12} /> {t("arcade.loot.miCollection")}
            </Link>
          </div>
        </div>
      </Panel>

      {!uuid && (
        <Panel tone="deep" tight className="mb-4">
          <p role="alert" className="font-ar-mono text-[12px] text-ar-amber">
            {t("arcade.common.loginRequiredBoxes")}
          </p>
        </Panel>
      )}

      {openBox.isError && (
        <Panel tone="deep" tight className="mb-4">
          <p role="alert" className="font-ar-mono text-[12px] text-ar-danger">
            {userMessageFrom(openBox.error, t("arcade.loot.boxOpenError"))}
          </p>
        </Panel>
      )}

      {box && (
        <>
          <SectionTitle
            kicker={t("arcade.loot.selectBox")}
            title={box.name}
            accent={TITLE_ACCENT[boxAccent(box.theme)] ?? "violet"}
            right={
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon.Info s={12} />}
                onClick={() => setInfo(true)}
              >
                {t("arcade.loot.howItWorks")}
              </Button>
            }
          />

          <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
            <BoxCarousel boxes={boxes} index={index} onIndex={setIndex} owned={owned} />
            <BoxOddsPanel
              box={box}
              owned={owned[box.id] ?? 0}
              opening={openBox.isPending}
              onOpen={() => void open(box)}
              onShowInfo={() => setInfo(true)}
            />
          </div>
        </>
      )}

      <LootInfoModal open={info} onClose={() => setInfo(false)} box={box} />
    </>
  )
}
