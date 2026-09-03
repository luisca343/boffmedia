"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, FurretMascot, Input, toast } from "../../../_components/ui";
import { useClap, useSubscribeNewsletter } from "../../../_hooks/queries";
import type { FtArticle } from "../../../_utils/article";

/**
 * Not the `Card` primitive: it hard-codes a white fill, and this block needs
 * the soft-yellow one — so the border/radius/shadow are matched by hand
 * instead of fighting a baked-in background class.
 */
export function ArticleFooter({ article }: { article: FtArticle }) {
  const t = useTranslations("furrettoday");
  const clap = useClap(article.id);
  const subscribe = useSubscribeNewsletter();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState("");

  function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    subscribe.mutate(value, {
      onSuccess: () => {
        setEmail("");
        setShowSubscribe(false);
        toast(t("footer.newsletterSuccess"));
      },
      onError: () =>
        toast.error(t("articleFooter.subscribeError")),
    });
  }

  return (
    <div className="border-ft rounded-ft-lg border-ft-ink bg-ft-yellow-soft p-6 shadow-ft-pop">
      <div className="flex flex-wrap items-center gap-4">
        <FurretMascot size={64} />
        <div className="min-w-[13.75rem] flex-1">
          <div className="font-ft-display text-[1.75rem] leading-[0.95]">
            {t("articleFooter.title")}
          </div>
          <p className="mt-1 text-ft-body">
            {t("articleFooter.description")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={() => clap.mutate()}
            disabled={clap.isPending}
            aria-label={t("articleFooter.clapAria")}
          >
            👏 {article.claps}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowSubscribe((v) => !v)}
          >
            {t("articleFooter.subscribe")}
          </Button>
        </div>
      </div>

      {showSubscribe ? (
        <form onSubmit={onSubscribe} className="mt-4 flex max-w-md gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("footer.emailPlaceholder")}
            aria-label={t("footer.emailAriaLabel")}
            className="flex-1"
          />
          <Button type="submit" variant="ink" disabled={subscribe.isPending}>
            {subscribe.isPending ? t("articleFooter.submitting") : t("articleFooter.submit")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
