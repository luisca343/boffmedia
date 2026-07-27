"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useBoffSession } from "@/services/useBoffSession";
import { useFormat } from "@/lib/useFormat";

import { articleHref } from "../../../_components/ArticleCard";
import {
  Avatar,
  Button,
  CardFlat,
  Eyebrow,
  Meta,
  Textarea,
} from "../../../_components/ui";
import {
  useComments,
  useDeleteComment,
  usePostComment,
} from "../../../_hooks/queries";
import { relatedTo, type FtArticle } from "../../../_utils/article";

function ReadingProgress() {
  const t = useTranslations("furrettoday");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setPct(
        Math.min(100, Math.max(0, (doc.scrollTop / Math.max(1, total)) * 100)),
      );
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <CardFlat className="p-4">
      <div className="flex justify-between">
        <Eyebrow className="text-ft-pink">{t("sidebar.progress")}</Eyebrow>
        <Meta>{Math.round(pct)}%</Meta>
      </div>
      <div className="border-ft mt-2 h-3 overflow-hidden rounded-ft-pill border-ft-ink bg-ft-paper-2">
        <div
          className="h-full bg-ft-pink transition-[width] duration-75 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </CardFlat>
  );
}

function SidebarShare({ onShare }: { onShare: () => void }) {
  const t = useTranslations("furrettoday");
  return (
    <CardFlat className="p-4">
      <Eyebrow className="mb-2 text-ft-pink">{t("sidebar.share")}</Eyebrow>
      <Button variant="primary" size="sm" onClick={onShare} className="w-full">
        {t("sidebar.shareArticle")}
      </Button>
    </CardFlat>
  );
}

function SidebarRelated({
  article,
  articles,
}: {
  article: FtArticle;
  articles: FtArticle[];
}) {
  const t = useTranslations("furrettoday");
  const items = relatedTo(article, articles, 3);
  if (items.length === 0) return null;

  return (
    <CardFlat className="p-4">
      <Eyebrow className="mb-3 text-ft-pink">{t("sidebar.related")}</Eyebrow>
      <div className="grid gap-3">
        {items.map((a, i) => (
          <Link
            key={a.id}
            href={articleHref(a.id)}
            className="grid grid-cols-[40px_1fr] items-center gap-2.5 rounded-ft-md p-1.5 hover:bg-ft-ink/5"
          >
            <span
              className="ft-stamp shrink-0"
              style={{ fontSize: 34 }}
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="font-ft-display text-base leading-tight">
                {a.title}
              </div>
              <Meta className="mt-0.5 block">{a.eyebrow}</Meta>
            </div>
          </Link>
        ))}
      </div>
    </CardFlat>
  );
}

function SidebarComments({ newsId }: { newsId: number }) {
  const t = useTranslations("furrettoday");
  const { date } = useFormat();
  const formatCommentDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return date(d, { day: "numeric", month: "short" });
  };
  const { data: comments } = useComments(newsId);
  const post = usePostComment(newsId);
  const del = useDeleteComment(newsId);
  const { isRotomAdmin } = useBoffSession();
  const [body, setBody] = useState("");
  const canDelete = isRotomAdmin();
  const list = comments ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = body.trim();
    if (!value) return;
    post.mutate(value, { onSuccess: () => setBody("") });
  }

  return (
    <CardFlat className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow className="text-ft-pink">{t("sidebar.comments")}</Eyebrow>
        <Meta>{list.length}</Meta>
      </div>

      {list.length > 0 ? (
        <div className="grid gap-3">
          {list.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.username} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-ft-ui truncate text-[13px] font-bold">
                    @{c.username}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Meta className="text-[11px]">
                      {formatCommentDate(c.createdAt)}
                    </Meta>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => del.mutate(c.id)}
                        disabled={del.isPending}
                        aria-label={t("article.deleteCommentAriaLabel")}
                        className="text-ft-ink/40 hover:text-ft-pink"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-snug text-ft-body">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Meta className="block">{t("sidebar.commentsEmpty")}</Meta>
      )}

      {post.canComment ? (
        <form onSubmit={submit} className="mt-3.5 grid gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("article.commentPlaceholder")}
            rows={3}
            aria-label={t("article.commentAriaLabel")}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={post.isPending || !body.trim()}
          >
            {post.isPending ? t("sidebar.posting") : t("sidebar.post")}
          </Button>
        </form>
      ) : (
        <Meta className="mt-3.5 block">{t("sidebar.signInToComment")}</Meta>
      )}
    </CardFlat>
  );
}

/** The whole right rail: reading progress, share, related reads, comments. */
export function ArticleSidebar({
  article,
  articles,
  onShare,
}: {
  article: FtArticle;
  articles: FtArticle[];
  onShare: () => void;
}) {
  return (
    <aside className="sticky top-[110px] grid gap-5">
      <ReadingProgress />
      <SidebarShare onShare={onShare} />
      <SidebarRelated article={article} articles={articles} />
      <SidebarComments newsId={article.id} />
    </aside>
  );
}
