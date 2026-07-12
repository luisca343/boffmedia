"use client";
import { useState } from "react";
import { Chip, Icon, Modal } from "../ui";
import type { ImageMessageData } from "../../_types/Chat";
import type { ChatVM } from "../../_types/view";
import { sharedDocuments, sharedImages, sharedVideos, sharedWaypoints } from "../../_utils/media";

const TABS = ["Fotos", "Vídeos", "Waypoints", "Documentos"] as const;

export function MediaModal({ chat, onClose, onOpenImage }: { chat: ChatVM; onClose: () => void; onOpenImage: (d: ImageMessageData) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Fotos");
  const images = sharedImages(chat);
  const videos = sharedVideos(chat);
  const waypoints = sharedWaypoints(chat);
  const documents = sharedDocuments(chat);

  const Empty = ({ icon, text }: { icon: "image" | "play" | "mappin" | "file"; text: string }) => (
    <div className="px-2.5 py-10 text-center text-ca-500">
      <Icon name={icon} size={32} className="mx-auto opacity-50" />
      <p className="mt-2.5 text-[13.5px]">{text}</p>
    </div>
  );

  return (
    <Modal title="Multimedia y archivos" icon="image" wide onClose={onClose}>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>
        ))}
      </div>

      {tab === "Fotos" &&
        (images.length ? (
          <div className="grid grid-cols-4 gap-1.5">
            {images.map((img) => (
              <button key={img.messageId} onClick={() => onOpenImage(img)} className="aspect-square overflow-hidden rounded-ca-md bg-ca-800">
                <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <Empty icon="image" text="Aún no hay fotos compartidas." />
        ))}

      {tab === "Vídeos" &&
        (videos.length ? (
          <div className="flex flex-col gap-2">
            {videos.map((v, i) => (
              <a key={i} href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2 hover:bg-ca-500/20">
                <img src={`https://img.youtube.com/vi/${v.videoId}/default.jpg`} alt="" className="h-12 w-20 flex-none rounded-ca-sm object-cover" />
                <span className="truncate text-[14px] text-ca-100">{v.title || "Vídeo de YouTube"}</span>
              </a>
            ))}
          </div>
        ) : (
          <Empty icon="play" text="Aún no hay vídeos compartidos." />
        ))}

      {tab === "Waypoints" &&
        (waypoints.length ? (
          <div className="flex flex-col gap-2">
            {waypoints.map((w, i) => (
              <div key={i} className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2.5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md" style={{ background: `${w.color || "#f97316"}33`, color: w.color || "#f97316" }}>
                  <Icon name="mappin" size={20} />
                </span>
                <div>
                  <div className="text-[14.5px] font-semibold text-ca-50">{w.name}</div>
                  <div className="font-ca-mono text-[12px] text-ca-400">X {w.x} · Y {w.y} · Z {w.z}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon="mappin" text="Aún no hay waypoints compartidos." />
        ))}

      {tab === "Documentos" &&
        (documents.length ? (
          <div className="flex flex-col gap-2">
            {documents.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2.5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md bg-ca-info/20 text-ca-info"><Icon name="file" size={20} /></span>
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-semibold text-ca-50">{d.title}</div>
                  {d.content && <div className="truncate text-[12.5px] text-ca-400">{d.content}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon="file" text="Aún no hay documentos compartidos." />
        ))}
    </Modal>
  );
}
