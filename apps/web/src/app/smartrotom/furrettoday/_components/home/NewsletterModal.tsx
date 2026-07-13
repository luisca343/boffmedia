"use client";

import { useState } from "react";

import { useSubscribeNewsletter } from "../../_hooks/queries";
import { Button, ComicBurst, FurretMascot, Input, Modal, toast } from "../ui";

export function NewsletterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
      onError: () => toast("No hemos podido apuntarte. Prueba de nuevo.", "warn"),
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
            <div className="border-ft rounded-ft mt-2 border-ft-ink bg-white p-[18px]">
              <div className="font-ft-display text-[28px]">¡LISTO!</div>
              <p className="font-ft mt-1 text-ft-body">
                Te hemos guardado en la lista. Nos vemos el viernes.
              </p>
            </div>
          ) : (
            <>
              <h3 className="font-ft-display mb-1.5 mt-1 text-[42px] leading-[0.95]">
                Furret a tu buzón, todos los viernes
              </h3>
              <p className="font-ft mb-[18px] text-ft-body">
                Un email. Titulares, meta, torneos y un meme. Cancelas cuando quieras.
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2.5">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  aria-label="Email"
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="lg" disabled={isPending}>
                  {isPending ? "…" : "SUSCRIBIR"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
