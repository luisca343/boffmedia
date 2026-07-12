"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore";
import { Icon } from "../ui";
import type { ImageMessageData, PokemonEntity } from "../../_types/Chat";

const SPRITE = (dex: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

export function ImageBubble({
  data,
  out,
  time,
  onOpen,
}: {
  data: ImageMessageData;
  out: boolean;
  time: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { addScreenshot } = useCameraGalleryStore();
  const meta = data.meta;
  const entities = meta?.entities ?? [];
  const scanned = !!meta?.location || entities.length > 0;

  const save = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      addScreenshot(data.imageUrl, meta?.location as never, meta?.entities);
      toast.success("Imagen guardada en la galería");
    } catch {
      toast.error("Error al guardar la imagen");
    }
  };

  return (
    <div className={cn("w-[320px] max-w-full overflow-hidden rounded-[10px] shadow-ca-bubble", out ? "bg-ca-bubble-out" : "bg-ca-bubble-in")}>
      <div className="group relative aspect-[16/10] cursor-pointer overflow-hidden bg-ca-950" onClick={onOpen}>
        <img src={data.imageUrl} alt={meta?.caption || "Captura"} className="h-full w-full object-cover" />
        {scanned && (
          <div className="absolute left-2 top-2 flex items-center gap-[5px] rounded-full border border-ca-online/40 bg-black/60 px-2 py-[3px] font-ca-mono text-[10px] tracking-[.06em] text-ca-online backdrop-blur-sm">
            <Icon name="sparkles" size={11} /> ESCANEADO
          </div>
        )}
        <button
          onClick={save}
          title="Guardar en galería"
          className="absolute right-2 top-2 grid h-[30px] w-[30px] place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        >
          <Icon name="download" size={15} />
        </button>
      </div>

      {meta?.caption && <div className="px-[11px] pt-[7px] text-[13.8px] text-ca-bubble-in-text">{meta.caption}</div>}

      {scanned && (
        <>
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex w-full items-center justify-between gap-2 border-t border-ca-500/20 px-[11px] py-2 text-[12.5px] text-ca-300 hover:bg-ca-500/10"
          >
            <span className="flex items-center gap-[7px]">
              <Icon name="cube" size={14} /> Detalles del escaneo · {entities.length}
            </span>
            <Icon name="chevdown" size={15} className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="flex flex-col gap-2 px-[11px] pb-2.5 pt-1 text-[12px]">
              {meta?.location && (
                <div className="flex items-start gap-2 text-ca-300">
                  <Icon name="mappin" size={14} className="mt-px flex-none text-ca-accent-soft" />
                  <div>
                    <div className="font-ca-mono text-ca-100">
                      X {meta.location.playerPosition.x.toFixed(1)} · Y {meta.location.playerPosition.y.toFixed(1)} · Z {meta.location.playerPosition.z.toFixed(1)}
                    </div>
                    {meta.location.lookingAt?.block && (
                      <div className="mt-0.5 text-ca-500">mirando a {meta.location.lookingAt.block.replace("minecraft:", "")}</div>
                    )}
                  </div>
                </div>
              )}
              {entities.map((e, i) => {
                const isPokemon = e.type === "pokemon";
                const dex = (e as PokemonEntity).dex;
                return (
                  <div key={i} className="flex items-center gap-[9px] rounded-ca-md bg-ca-500/10 p-1.5">
                    <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-ca-md bg-ca-500/[.12]">
                      {isPokemon ? (
                        <img src={SPRITE(dex)} alt="" className="h-[30px] w-[30px] [image-rendering:pixelated]" />
                      ) : (
                        <Icon name="users" size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-ca-100">
                        {isPokemon ? (e as PokemonEntity).species : (e as { name: string }).name}
                        {isPokemon && (e as PokemonEntity).form === "Shiny" ? " ✦" : ""}
                      </div>
                      <div className="font-ca-mono text-[10.5px] text-ca-400">
                        {isPokemon ? `#${String(dex).padStart(3, "0")} · ${(e as PokemonEntity).form || "Normal"}` : "NPC"} · cob. {e.coverage}%
                      </div>
                    </div>
                    <div className="ml-auto font-ca-mono text-[10.5px] text-ca-accent-soft">{e.distance}m</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="px-3 pb-2 pt-0 text-right text-[10.5px] text-ca-500">{time}</div>
    </div>
  );
}
