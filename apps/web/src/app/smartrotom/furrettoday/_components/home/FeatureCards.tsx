import Link from "next/link";
import { useTranslations } from "next-intl";

import { ACCENT_HEX, ACCENT_ON, type FtAccent } from "../../_utils/accents";
import type { FtArticle } from "../../_utils/article";
import { articleHref } from "../ArticleCard";
import { Button, Card, ComicBurst, HeroArt, Meta, Pill } from "../ui";

/** The lead story — the widest column of the featured trio. */
export function BigFeatureCard({ article }: { article: FtArticle }) {
  const t = useTranslations("furrettoday.featureCards");
  return (
    <Card lift className="flex flex-col overflow-hidden">
      <div className="border-ft relative h-[20rem] shrink-0 border-x-0 border-t-0 border-b-ft-ink">
        <HeroArt
          accent={article.accent}
          src={article.imageUrl}
          alt=""
          className="h-full w-full"
        />
        <div className="absolute left-3.5 top-3.5 flex gap-2">
          <Pill tone={article.accent}>{article.eyebrow}</Pill>
          <Pill tone="paper">{article.datelineShort}</Pill>
        </div>
        <ComicBurst
          size={94}
          color="rgb(var(--ft-pink))"
          textColor="white"
          text="HOT"
          style={{ position: "absolute", right: 14, bottom: 14, transform: "rotate(8deg)" }}
        />
      </div>

      <div className="flex flex-col gap-3 p-6">
        <h3 className="font-ft-display relative text-[2.75rem] leading-[0.95]">
          <Link
            href={articleHref(article.id)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.title}
          </Link>
        </h3>

        {article.deck ? (
          <p className="font-ft-deck text-xl italic text-ft-deck">{article.deck}</p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-4">
          <Meta>
            {article.author ? `${article.author} · ` : ""}
            {article.readTime}
          </Meta>
          <Button tabIndex={-1} aria-hidden="true">
            {t("read")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * A sidebar story, printed as a solid slab of colour.
 *
 * The colour is a LAYOUT role, not the article's section ink: the two slots
 * beside the lead story are always pink then purple, so the trio reads as a
 * composed page. Keying them off `article.accent` instead would print the whole
 * cover in one colour whenever the top stories happen to share a section — which
 * is the common case, since most weeks are dominated by one.
 */
export function SmallFeatureCard({
  article,
  accent,
}: {
  article: FtArticle;
  accent: FtAccent;
}) {
  const t = useTranslations("furrettoday.featureCards");
  const hex = ACCENT_HEX[accent];

  return (
    <Card
      lift
      className={`flex flex-col overflow-hidden ${ACCENT_ON[accent]}`}
      style={{ background: hex }}
    >
      <div className="ft-halftone border-ft relative h-[8.125rem] shrink-0 border-x-0 border-t-0 border-b-ft-ink">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: `linear-gradient(180deg, transparent 0%, ${hex} 100%)` }}
        />
        <Pill tone="yellow" className="absolute left-3 top-3">
          {article.eyebrow}
        </Pill>
        <Pill tone="paper" className="absolute right-3 top-3">
          {article.datelineShort}
        </Pill>
      </div>

      <div className="flex flex-grow flex-col gap-2.5 p-5">
        <h3 className="font-ft-display relative text-[1.75rem] leading-[0.95]">
          <Link
            href={articleHref(article.id)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.title}
          </Link>
        </h3>

        {article.deck ? (
          <p className="font-ft-deck text-base italic opacity-90">{article.deck}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2">
          <Meta className="opacity-90">
            {article.author ? `${article.author} · ` : ""}
            {article.readTime}
          </Meta>
          <Button variant="ink" size="sm" tabIndex={-1} aria-hidden="true">
            {t("read")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
