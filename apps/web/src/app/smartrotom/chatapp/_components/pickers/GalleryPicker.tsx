"use client";
import { useState } from "react";
import { useCameraGalleryStore, type Screenshot } from "@/stores/cameraGalleryStore";
import { Button, Icon, Modal, ModalFoot } from "../ui";

export function GalleryPicker({
  open,
  onOpenChange,
  onSendImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendImage: (screenshot: Screenshot, caption?: string) => void;
}) {
  const { gallery } = useCameraGalleryStore();
  const [selected, setSelected] = useState<Screenshot | null>(null);
  const [caption, setCaption] = useState("");
  if (!open) return null;

  const close = () => {
    onOpenChange(false);
    setSelected(null);
    setCaption("");
  };
  const send = () => {
    if (!selected) return;
    onSendImage(selected, caption.trim() || undefined);
    close();
  };

  return (
    <Modal
      title="Compartir captura"
      icon="image"
      wide
      onClose={close}
      foot={
        selected ? (
          <ModalFoot>
            <Button variant="ghost" onClick={() => setSelected(null)}>Elegir otra</Button>
            <Button onClick={send}><Icon name="send" size={16} /> Enviar</Button>
          </ModalFoot>
        ) : undefined
      }
    >
      {gallery.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-ca-500">
          <Icon name="camera" size={34} className="opacity-50" />
          <p className="text-[13.5px]">Aún no tienes capturas en tu galería.</p>
        </div>
      ) : selected ? (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-ca-lg bg-ca-950">
            <img src={selected.image} alt="Captura" className="max-h-[340px] w-full object-contain" />
          </div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Añade un comentario…"
            className="w-full rounded-ca-md border border-ca-700 bg-ca-search-bg px-3 py-2.5 text-[14px] text-ca-50 outline-none placeholder:text-ca-500 focus:border-ca-accent/50"
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {gallery.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="relative aspect-square overflow-hidden rounded-ca-md bg-ca-800 transition-[box-shadow] hover:shadow-[inset_0_0_0_2px_rgb(var(--ca-accent))]"
            >
              <img src={s.image} alt="" className="h-full w-full object-cover" />
              {!!s.entities?.length && (
                <span className="absolute left-1 top-1 rounded bg-black/50 px-1.5 py-px font-ca-mono text-[8.5px] text-ca-online">SCAN</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
