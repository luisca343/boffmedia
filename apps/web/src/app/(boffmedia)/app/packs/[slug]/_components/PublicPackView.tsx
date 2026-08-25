"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { Badge, Button, OptionalChooser } from "@boffmedia/ui"
import type { PublicPack } from "@/services/api/boffmedia/publicPacksService"

// A pack's shareable page: what it is, what it runs on, what it lets you
// choose, and one button to go and get the app.
//
// The optional-content block is `@boffmedia/ui`'s OptionalChooser in `readOnly`
// mode — the SAME component the launcher renders. That is the point of it being
// host-agnostic: the page and the app describe a pack's choices identically,
// rather than through two hand-written descriptions that drift apart the first
// time someone adds a group.
//
// A client component because the chooser uses hooks (`useRoving`), so it cannot
// render on the server. The DATA is fetched in `page.tsx` and passed down, which
// keeps the page server-rendered for link previews and search engines — the
// whole reason this route exists.

export function PublicPackView({ pack }: { pack: PublicPack }) {
  const t = useTranslations("app.packPage")

  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-8 px-5 py-12">
      <header className="flex flex-wrap items-start gap-5">
        {pack.iconUrl && (
          <Image
            src={pack.iconUrl}
            alt=""
            width={88}
            height={88}
            className="shrink-0 border border-solid border-line object-cover"
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[32px]/none font-bold uppercase tracking-[0.05em] text-txt">
            {pack.name}
          </h1>
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
            {pack.slug}
          </p>
          {pack.summary && (
            <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.5] text-txt-muted">
              {pack.summary}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {pack.version?.minecraft && (
              <Badge tone="info">Minecraft {pack.version.minecraft}</Badge>
            )}
            {pack.version?.loader && (
              <Badge>
                {pack.version.loader}
                {pack.version.loaderVersion ? ` ${pack.version.loaderVersion}` : ""}
              </Badge>
            )}
            {pack.version && (
              <Badge>{t("files", { count: pack.version.fileCount })}</Badge>
            )}
            {/* The host, never the port — this is a description of the pack, not
                something anyone connects from. */}
            {pack.serverHost && <Badge tone="ok">{pack.serverHost}</Badge>}
          </div>
        </div>
      </header>

      {/* The call to action, and the reason the page exists: a link you hand
          someone alongside the download. */}
      <section className="flex flex-wrap items-center gap-3 border border-solid border-accent-line bg-accent-soft px-5 py-4">
        <p className="min-w-0 flex-1 text-[14px] leading-[1.5] text-txt">{t("installLead")}</p>
        {/* `Button` routes an internal href through the host Link registered
            with `configureUi`, so this stays a real client-side navigation
            without the page importing next/link itself. */}
        <Button href="/app" variant="pri" icon="download">
          {t("getApp")}
        </Button>
      </section>

      {pack.description && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.05em]">
            {t("about")}
          </h2>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-txt-muted">
            {pack.description}
          </p>
        </section>
      )}

      {pack.optionalGroups.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.05em]">
              {t("optionalTitle")}
            </h2>
            <p className="max-w-[60ch] text-[13px] leading-[1.5] text-txt-muted">
              {t("optionalLead")}
            </p>
          </div>
          {/* `readOnly`: there is nothing to toggle here and nobody to toggle it
              for. What the badges show is the AUTHOR's default, which is exactly
              what someone deciding whether to install wants to know. */}
          <OptionalChooser groups={pack.optionalGroups} readOnly t={t} />
        </section>
      )}

      {pack.gallery.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.05em]">
            {t("gallery")}
          </h2>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {pack.gallery.map((image) => (
              <Image
                key={image.url}
                src={image.url}
                alt={image.alt ?? ""}
                width={640}
                height={360}
                className="w-full border border-solid border-line object-cover"
                unoptimized
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
