"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Button,
  Divider,
  EmptyState,
  HeroArt,
  Meta,
  Skeleton,
} from "../../_components/ui";
import { useArticle, useNewsroom } from "../../_hooks/queries";
import { ArticleFooter } from "./_components/ArticleFooter";
import { ArticleHeader } from "./_components/ArticleHeader";
import { ArticleSidebar } from "./_components/ArticleSidebar";
import { ShareModal } from "./_components/ShareModal";
import { UpNext } from "./_components/UpNext";

const BASE = "/smartrotom/furrettoday";

/**
 * CKEditor's saved HTML repeats the title as its own leading `<h1>`, and
 * `ArticleHeader` already prints it — so it is cut before injection rather
 * than shown twice. Anchored to the start: only a genuinely leading heading
 * is removed, never one a writer used further down the piece.
 */
function stripLeadingHeading(html: string): string {
  return html.replace(/^\s*<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/i, "");
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("furrettoday.article");
  const { id } = use(params);
  const router = useRouter();
  const numericId = Number(id);
  const validId = Number.isFinite(numericId) && numericId > 0;

  const { data: article, isLoading, error } = useArticle(numericId);
  const { articles } = useNewsroom();
  const [shareOpen, setShareOpen] = useState(false);

  if (!validId || error || (!isLoading && !article)) {
    return (
      <div className="mx-auto max-w-[880px] px-6 py-16">
        <EmptyState
          title={t("notFoundTitle")}
          message={t("notFoundMessage")}
          actionLabel={t("backToCover")}
          onAction={() => router.push(BASE)}
        />
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="mx-auto max-w-[880px] px-6 py-16">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-6 h-[420px] w-full" />
        <div className="mt-8 grid gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b-ft-hair border-dashed border-b-ft-ink bg-ft-paper-2">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(BASE)}>
            {t("backCover")}
          </Button>
          <Meta>/</Meta>
          <Meta>{article.eyebrow}</Meta>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setShareOpen(true)}>
              {t("share")}
            </Button>
          </div>
        </div>
      </div>

      <ArticleHeader article={article} />

      <div className="bg-ft-paper px-6 py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="border-ft-thick overflow-hidden rounded-ft-lg border-ft-ink shadow-ft-pop-lg">
            <HeroArt
              accent={article.accent}
              src={article.imageUrl}
              alt={article.title}
              className="h-[420px] w-full"
            />
          </div>
          <div className="mt-2.5 flex justify-between">
            <Meta>{t("illustration")}</Meta>
            <Meta>{t("figure")}</Meta>
          </div>
        </div>
      </div>

      <main className="px-6 pb-16 pt-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
          <article>
            <div
              className="ft-article ft-dropcap"
              dangerouslySetInnerHTML={{
                __html: stripLeadingHeading(article.content),
              }}
            />
            <Divider className="my-8" />
            <ArticleFooter article={article} />
          </article>

          <ArticleSidebar
            article={article}
            articles={articles}
            onShare={() => setShareOpen(true)}
          />
        </div>
      </main>

      <UpNext article={article} articles={articles} />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={article.title}
      />
    </div>
  );
}
