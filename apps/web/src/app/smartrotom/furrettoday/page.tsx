"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ArticleCard } from "./_components/ArticleCard";
import { CollectorStrip } from "./_components/home/CollectorStrip";
import { CoverHero } from "./_components/home/CoverHero";
import { BigFeatureCard, SmallFeatureCard } from "./_components/home/FeatureCards";
import { NewsletterModal } from "./_components/home/NewsletterModal";
import { SubscribeStrip } from "./_components/home/SubscribeStrip";
import { EmptyState, Marquee, SectionHeader, Skeleton } from "./_components/ui";
import { useNewsroom } from "./_hooks/queries";
import { tickerOf } from "./_utils/article";

export default function FurretTodayHome() {
  const t = useTranslations("furrettoday.home");
  const { cover, published, isLoading, error } = useNewsroom();
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  const ticker = useMemo(() => tickerOf(published, 8), [published]);
  const moreArticles = published.slice(3);

  if (isLoading) {
    return (
      <div className="ft-wrap-wide space-y-6 px-6 py-16">
        <Skeleton className="h-[26.25rem] w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-1" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !cover) {
    return (
      <div className="ft-wrap-wide px-6 py-16">
        <EmptyState
          title={t("emptyTitle")}
          message={t("emptyMessage")}
        />
      </div>
    );
  }

  return (
    <div>
      <CoverHero cover={cover} contents={published.slice(0, 4)} />

      <Marquee items={ticker} tone="yellow" label={t("tickerLabel")} />

      {published.length > 0 ? (
        <section className="ft-wrap-wide px-6 pb-6 pt-14">
          <SectionHeader
            eyebrow={t("topEyebrow")}
            title={t("topTitle")}
            number="01"
          />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr_1fr]">
            {published[0] ? <BigFeatureCard article={published[0]} /> : null}
            {published[1] ? (
              <SmallFeatureCard article={published[1]} accent="pink" />
            ) : null}
            {published[2] ? (
              <SmallFeatureCard article={published[2]} accent="purple" />
            ) : null}
          </div>
        </section>
      ) : null}

      <SubscribeStrip onOpen={() => setNewsletterOpen(true)} />

      {moreArticles.length > 0 ? (
        <section className="ft-wrap-wide px-6 pb-14 pt-6">
          <SectionHeader
            eyebrow={t("moreEyebrow")}
            title={t("moreTitle")}
            number="02"
          />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      <CollectorStrip />

      <NewsletterModal
        open={newsletterOpen}
        onClose={() => setNewsletterOpen(false)}
      />
    </div>
  );
}
