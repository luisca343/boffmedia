import Link from "next/link";
import { useTranslations } from "next-intl";

import type { FtArticle } from "../_utils/article";
import { Button, Card, HeroArt, Meta, Pill } from "./ui";

/** Where an article lives. One place, so no screen can invent a different URL. */
export function articleHref(id: number) {
  return `/smartrotom/furrettoday/leer/${id}`;
}

/** The standard grid card, shared by the cover screen and the browse screen. */
export function ArticleCard({ article }: { article: FtArticle }) {
  const t = useTranslations("furrettoday.articleCard");
  return (
    <Card lift className="relative flex h-full flex-col overflow-hidden">
      <div className="border-ft relative h-[11.25rem] shrink-0 border-x-0 border-t-0 border-b-ft-ink">
        <HeroArt
          accent={article.accent}
          src={article.imageUrl}
          alt=""
          mascot={false}
          className="h-full w-full"
        />
        <Pill tone={article.accent} className="absolute left-3 top-3">
          {article.eyebrow}
        </Pill>
      </div>

      <div className="flex flex-grow flex-col gap-2.5 p-5">
        <h3 className="font-ft-display text-[1.625rem] leading-none tracking-[0.02em]">
          <Link
            href={articleHref(article.id)}
            // Stretched link: the whole card is the hit target, but the accessible
            // name stays the headline rather than the card's whole contents.
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.title}
          </Link>
        </h3>

        {article.deck ? (
          <p className="font-ft-deck line-clamp-3 text-base italic text-ft-deck">
            {article.deck}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Meta>
            {article.author ? `${article.author} · ` : ""}
            {article.readTime}
          </Meta>
          <Button size="sm" tabIndex={-1} aria-hidden="true">
            {t("read")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
