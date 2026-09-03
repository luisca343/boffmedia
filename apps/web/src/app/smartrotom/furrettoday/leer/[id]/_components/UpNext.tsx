import Link from "next/link";
import { useTranslations } from "next-intl";

import { articleHref } from "../../../_components/ArticleCard";
import { Card, Eyebrow, HeroArt, Meta, Pill } from "../../../_components/ui";
import { relatedTo, type FtArticle } from "../../../_utils/article";

/**
 * "No Pares de Caminar" — newest published articles, excluding whatever the
 * sidebar's "Seguir leyendo" already suggested, so the two widgets never
 * repeat the same three cards.
 */
export function UpNext({
  article,
  articles,
}: {
  article: FtArticle;
  articles: FtArticle[];
}) {
  const t = useTranslations("furrettoday.upNext");
  const related = relatedTo(article, articles, 3);
  const relatedIds = new Set(related.map((a) => a.id));

  const picks = articles
    .filter(
      (a) => a.published && a.id !== article.id && !relatedIds.has(a.id),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section className="ft-cover-ink py-14">
      <div className="mx-auto max-w-[87.5rem] px-6">
        <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-dashed border-white/30 pb-3">
          <div>
            <Eyebrow className="text-ft-yellow">{t("eyebrow")}</Eyebrow>
            <h2 className="font-ft-display mt-1 text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-ft-yellow">
              {t("title")}
            </h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {picks.map((a) => (
            <Link key={a.id} href={articleHref(a.id)} className="block">
              <Card lift className="h-full overflow-hidden text-ft-ink">
                <div className="border-ft relative h-40 border-x-0 border-t-0 border-b-ft-ink">
                  <HeroArt
                    accent={a.accent}
                    src={a.imageUrl}
                    alt=""
                    mascot={false}
                    className="h-full w-full"
                  />
                  <Pill tone={a.accent} className="absolute left-2.5 top-2.5">
                    {a.eyebrow}
                  </Pill>
                </div>
                <div className="p-5">
                  <h3 className="font-ft-display text-2xl leading-none">
                    {a.title}
                  </h3>
                  <Meta className="mt-2 block">
                    {a.author ? `${a.author} · ` : ""}
                    {a.readTime}
                  </Meta>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
