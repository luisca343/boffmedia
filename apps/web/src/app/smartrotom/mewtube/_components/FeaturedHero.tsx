import { Avatar, Button, Check, I } from "@/components/smartrotom/media/ui"

export interface FeaturedData {
  href: string
  thumb?: string
  title: string
  creator: string
  creatorAvatar?: string
  verified?: boolean
  views: string
  age: string
  duration?: string
}

/** Home hero — a single editorialized/top video with a bled poster + vignette. */
export function FeaturedHero({ data }: { data: FeaturedData }) {
  return (
    <section className="relative h-[480px] overflow-hidden">
      {data.thumb && (
        <div
          className="absolute inset-0 z-0 scale-[1.04] bg-cover bg-center brightness-[0.55] saturate-[1.1]"
          style={{ backgroundImage: `url(${data.thumb})` }}
        />
      )}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(95deg,color-mix(in srgb,rgb(var(--mw-accent)) 55%,rgb(var(--mw-bg))) 0%,color-mix(in srgb,rgb(var(--mw-accent)) 30%,rgb(var(--mw-bg))) 35%,rgba(3,5,15,.5) 65%,rgba(3,5,15,0) 95%)",
        }}
      />
      <div className="relative z-[2] mx-auto flex h-full max-w-[1640px] flex-col justify-end gap-[18px] px-6 py-10 md:px-10 md:py-[60px]">
        <h1 className="m-0 max-w-[880px] font-mw-display text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em] [text-wrap:balance]">
          {data.title}
        </h1>
        <div className="flex items-center gap-3">
          <Avatar
            src={data.creatorAvatar}
            name={data.creator}
            size={44}
            className="border-2 border-[color-mix(in_srgb,rgb(var(--mw-accent))_60%,transparent)]"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold">
              {data.creator}
              {data.verified && <Check />}
            </div>
            <div className="mt-0.5 text-xs text-mw-fg-mute">
              {[data.views && `${data.views} visitas`, data.age, data.duration].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="solid" size="lg" href={data.href}>
            <I.play size={14} /> Reproducir
          </Button>
          <Button variant="ghost" size="lg" aria-disabled title="Próximamente">
            <I.plus size={16} /> Ver más tarde
          </Button>
        </div>
      </div>
    </section>
  )
}
