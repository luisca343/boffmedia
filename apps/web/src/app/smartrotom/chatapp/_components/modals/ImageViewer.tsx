"use client";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore";
import { Button, Icon, Modal } from "../ui";
import type { ImageMessageData, PokemonEntity } from "../../_types/Chat";

export function ImageViewer({ data, onClose }: { data: ImageMessageData; onClose: () => void }) {
  const t = useTranslations("chatapp");
  const { addScreenshot } = useCameraGalleryStore();
  const meta = data.meta;
  const entities = meta?.entities ?? [];

  const save = () => {
    try {
      addScreenshot(data.imageUrl, meta?.location as never, meta?.entities);
      toast.success(t("message.imageSaved"));
    } catch {
      toast.error(t("message.imageSaveError"));
    }
  };
  const goLocation = () => {
    const p = meta?.location?.playerPosition;
    if (!p) return;
    navigator.clipboard.writeText(`${Math.round(p.x)} ${Math.round(p.y)} ${Math.round(p.z)}`);
    toast.success(t("message.coordinatesCopied"));
  };

  return (
    <Modal bare title="" onClose={onClose} scrimClassName="bg-black/85">
      <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-[720px] flex-col gap-3.5">
        <div className="relative overflow-hidden rounded-[18px] border border-ca-700 bg-ca-950">
          <img src={data.imageUrl} alt={meta?.caption || ""} className="max-h-[70vh] w-full object-contain" />
          <button onClick={onClose} className="absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70">
            <Icon name="x" size={20} />
          </button>
          {entities.length > 0 && (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {entities.map((e, i) => (
                <span key={i} className="rounded-full border border-ca-online/40 bg-black/60 px-2.5 py-1 font-ca-mono text-[11px] text-ca-online backdrop-blur-sm">
                  {e.type === "pokemon" ? (e as PokemonEntity).species : (e as { name: string }).name}
                </span>
              ))}
            </div>
          )}
        </div>
        {meta?.caption && <p className="text-center text-ca-100">{meta.caption}</p>}
        <div className="flex justify-center gap-2">
          <Button variant="ghost" onClick={save}><Icon name="download" size={16} /> {t("message.saveToGallery")}</Button>
          {meta?.location && <Button onClick={goLocation}><Icon name="mappin" size={16} /> {t("message.goToLocation")}</Button>}
        </div>
      </div>
    </Modal>
  );
}
