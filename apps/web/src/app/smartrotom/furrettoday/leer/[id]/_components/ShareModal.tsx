"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Eyebrow, Modal, toast } from "../../../_components/ui";

/**
 * Discord has no public web share-intent URL like Twitter/Reddit do, so its
 * button copies the link too — it just says so, rather than pretending to
 * open a Discord flow that does not exist.
 */
export function ShareModal({
  open,
  onClose,
  title,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  const t = useTranslations("furrettoday.shareModal");
  const [copied, setCopied] = useState(false);

  // Read only once the dialog is actually open — i.e. after a real click,
  // never during SSR/hydration — so there is no window-is-undefined branch.
  const url = open && typeof window !== "undefined" ? window.location.href : "";

  function copyLink() {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error(t("copyError")));
  }

  function copyForDiscord() {
    navigator.clipboard
      .writeText(url)
      .then(() => toast(t("discordCopied")))
      .catch(() => toast.error(t("copyError")));
  }

  function openIntent(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t("title")}
      className="px-6 pb-6 pt-9"
    >
      <Eyebrow className="text-ft-pink">{t("eyebrow")}</Eyebrow>
      <h3 className="font-ft-display mb-4 mt-1 text-3xl leading-none">
        {t("heading")}
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="default" onClick={copyForDiscord}>
          Discord
        </Button>
        <Button
          variant="cyan"
          onClick={() =>
            openIntent(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            )
          }
        >
          X / Twitter
        </Button>
        <Button
          variant="ink"
          onClick={() =>
            openIntent(
              `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
            )
          }
        >
          Reddit
        </Button>
        <Button variant="primary" onClick={copyLink}>
          {copied ? t("copied") : t("copyLink")}
        </Button>
      </div>
    </Modal>
  );
}
