"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useSubscribeNewsletter } from "../../_hooks/queries";
import { Button, ComicBurst, FurretMascot, Input, Modal, toast } from "../ui";

export function NewsletterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("furrettoday.newsletterModal");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { mutate, isPending } = useSubscribeNewsletter();

  function handleClose() {
    onClose();
    // Deferred so the form doesn't visibly reset while the close animation
    // is still playing.
    window.setTimeout(() => {
      setSent(false);
      setEmail("");
    }, 200);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(email, {
      onSuccess: () => setSent(true),
      onError: () => toast.error(t("error")),
    });
  }

  return (
    <Modal open={open} onClose={handleClose} label="Newsletter">
      <div
        className="rounded-ft-lg relative overflow-hidden"
        style={{ background: "rgb(var(--ft-yellow))" }}
      >
        <div
          aria-hidden="true"
          className="ft-halftone-dense pointer-events-none absolute inset-0 opacity-[0.18]"
        />
        <ComicBurst
          size={84}
          color="rgb(var(--ft-pink))"
          textColor="white"
          text="NEW!"
          style={{ position: "absolute", top: 18, right: 50, transform: "rotate(8deg)" }}
        />

        <div className="relative p-7">
          <FurretMascot size={84} className="-mb-2" />

          {sent ? (
            <div className="border-ft rounded-ft mt-2 border-ft-ink bg-white p-[1.125rem]">
              <div className="font-ft-display text-[1.75rem]">{t("successTitle")}</div>
              <p className="font-ft mt-1 text-ft-body">
                {t("successMessage")}
              </p>
            </div>
          ) : (
            <>
              <h3 className="font-ft-display mb-1.5 mt-1 text-[2.625rem] leading-[0.95]">
                {t("title")}
              </h3>
              <p className="font-ft mb-[1.125rem] text-ft-body">
                {t("description")}
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2.5">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  aria-label="Email"
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="lg" disabled={isPending}>
                  {isPending ? t("subscribing") : t("subscribe")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
