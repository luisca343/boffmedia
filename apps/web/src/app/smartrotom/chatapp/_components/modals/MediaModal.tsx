"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Chip, Icon, Modal } from "../ui";
import type { ImageMessageData } from "../../_types/Chat";
import type { ChatVM } from "../../_types/view";
import { sharedDocuments, sharedImages, sharedVideos, sharedWaypoints } from "../../_utils/media";

const TAB_KEYS = ["photos", "videos", "waypoints", "documents"] as const;

export function MediaModal({ chat, onClose, onOpenImage }: { chat: ChatVM; onClose: () => void; onOpenImage: (d: ImageMessageData) => void }) {
  const t = useTranslations("chatapp");
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>("photos");
  const images = sharedImages(chat);
  const videos = sharedVideos(chat);
  const waypoints = sharedWaypoints(chat);
  const documents = sharedDocuments(chat);

  const Empty = ({ icon, text }: { icon: "image" | "play" | "mappin" | "file"; text: string }) => (
    <div className="px-2.5 py-10 text-center text-ca-500">
      <Icon name={icon} size={32} className="mx-auto opacity-50" />
      <p className="mt-2.5 text-[0.84375rem]">{text}</p>
    </div>
  );

  return (
    <Modal title={t("media.title")} icon="image" wide onClose={onClose}>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {TAB_KEYS.map((k) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{t(`media.tabs.${k}`)}</Chip>
        ))}
      </div>

      {tab === "photos" &&
        (images.length ? (
          <div className="grid grid-cols-4 gap-1.5">
            {images.map((img) => (
              <button key={img.messageId} onClick={() => onOpenImage(img)} className="aspect-square overflow-hidden rounded-ca-md bg-ca-800">
                <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <Empty icon="image" text={t("media.emptyPhotos")} />
        ))}

      {tab === "videos" &&
        (videos.length ? (
          <div className="flex flex-col gap-2">
            {videos.map((v, i) => (
              <a key={i} href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2 hover:bg-ca-500/20">
                <img src={`https://img.youtube.com/vi/${v.videoId}/default.jpg`} alt="" className="h-12 w-20 flex-none rounded-ca-sm object-cover" />
                <span className="truncate text-[0.875rem] text-ca-100">{v.title || t("media.youtubeVideo")}</span>
              </a>
            ))}
          </div>
        ) : (
          <Empty icon="play" text={t("media.emptyVideos")} />
        ))}

      {tab === "waypoints" &&
        (waypoints.length ? (
          <div className="flex flex-col gap-2">
            {waypoints.map((w, i) => (
              <div key={i} className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2.5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md" style={{ background: `${w.color || "#f97316"}33`, color: w.color || "#f97316" }}>
                  <Icon name="mappin" size={20} />
                </span>
                <div>
                  <div className="text-[0.90625rem] font-semibold text-ca-50">{w.name}</div>
                  <div className="font-ca-mono text-[0.75rem] text-ca-400">X {w.x} · Y {w.y} · Z {w.z}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon="mappin" text={t("media.emptyWaypoints")} />
        ))}

      {tab === "documents" &&
        (documents.length ? (
          <div className="flex flex-col gap-2">
            {documents.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-ca-md bg-ca-500/10 p-2.5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md bg-ca-info/20 text-ca-info"><Icon name="file" size={20} /></span>
                <div className="min-w-0">
                  <div className="truncate text-[0.90625rem] font-semibold text-ca-50">{d.title}</div>
                  {d.content && <div className="truncate text-[0.78125rem] text-ca-400">{d.content}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon="file" text={t("media.emptyDocuments")} />
        ))}
    </Modal>
  );
}
