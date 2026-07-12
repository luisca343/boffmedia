import { Avatar, Button, I, LivePill, PulseDot, Tag } from "@/components/smartrotom/media/ui"

export interface HeroData {
  href: string
  thumb?: string
  title: string
  streamer: string
  streamerAvatar?: string
  game: string
  viewers: number
  uptime: string
  tags: string[]
}

/** Home hero — the featured live stream with a bled preview + viewer pulse. */
export function MewtwitchHero({ data }: { data: HeroData }) {
  return (
    <section className="relative h-[480px] overflow-hidden">
      {data.thumb && (
        <div
          className="absolute inset-0 z-0 scale-[1.05] bg-cover bg-center brightness-[0.4] saturate-[1.2]"
          style={{ backgroundImage: `url(${data.thumb})` }}
        />
      )}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(95deg,color-mix(in srgb,rgb(var(--mw-accent)) 60%,rgb(var(--mw-bg))) 0%,color-mix(in srgb,rgb(var(--mw-accent)) 30%,rgb(var(--mw-bg))) 35%,rgba(3,5,15,.55) 65%,transparent 95%)",
        }}
      />
      <LivePill size="lg" className="absolute left-3 top-3 z-[3]" />
      <div className="absolute right-3 top-3 z-[3] inline-flex items-center gap-1.5 rounded-mw-pill border border-mw-line-strong bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-[10px]">
        <PulseDot /> <strong className="font-mono">{data.viewers.toLocaleString("es-ES")}</strong> viendo ahora
      </div>

      <div className="relative z-[2] mx-auto flex h-full max-w-[1640px] flex-col justify-center px-6 md:px-10">
        <div className="max-w-[740px]">
          <div className="mb-[18px] inline-flex w-max items-center gap-2 rounded-mw-pill border border-mw-accent/40 bg-mw-accent/[.18] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-mw-accent">
            <PulseDot /> {data.game} · en directo
          </div>
          <h1 className="m-0 max-w-[740px] font-mw-display text-[clamp(28px,4vw,50px)] font-extrabold leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">
            {data.title}
          </h1>
          <div className="mt-[18px] inline-flex items-center gap-3">
            <Avatar src={data.streamerAvatar} name={data.streamer} size={56} ring />
            <div>
              <div className="inline-flex items-center gap-1.5 text-[15px] font-bold">{data.streamer}</div>
              <div className="mt-0.5 text-xs text-mw-fg-mute">
                {data.game}
                {data.uptime && ` · ${data.uptime} en directo`}
              </div>
            </div>
          </div>
          {data.tags.length > 0 && (
            <div className="my-[14px] flex flex-wrap gap-1.5">
              {data.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="solid" size="lg" href={data.href}>
              <I.play size={14} /> Ver directo
            </Button>
            {/* [deferred] follow needs Twitch OAuth (§13) */}
            <Button variant="ghost" size="lg" aria-disabled title="Próximamente">
              <I.heart size={16} /> Seguir
            </Button>
            <Button variant="ghost" size="lg" href={`${data.href}#chat`}>
              <I.chat size={16} /> Unirse al chat
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
