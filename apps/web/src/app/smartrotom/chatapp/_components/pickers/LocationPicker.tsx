"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getMcUserData, getWaypoints, type Waypoint } from "@/services/mcef/mcefApi";
import { Icon, Modal } from "../ui";

type WP = { name: string; x: number; y: number; z: number; dimension?: string; color?: string };

export function WaypointPicker({
  open,
  onOpenChange,
  onWaypointSelect,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onWaypointSelect: (wp: WP) => void;
}) {
  const t = useTranslations("chatapp");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [current, setCurrent] = useState<{ x: number; y: number; z: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getWaypoints(), getMcUserData()])
      .then(([wpRes, user]) => {
        if (wpRes.success && wpRes.waypoints) setWaypoints(wpRes.waypoints);
        if (user.data) setCurrent({ x: Math.round(user.data.x), y: Math.round(user.data.y), z: Math.round(user.data.z) });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  const close = () => onOpenChange?.(false);
  const pick = (wp: WP) => { onWaypointSelect(wp); close(); };

  const Row = ({ color, title, coords, onClick }: { color: string; title: string; coords: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-ca-md p-2 text-left transition-colors hover:bg-ca-500/10">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md" style={{ background: `${color}33`, color }}>
        <Icon name="mappin" size={20} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-semibold text-ca-50">{title}</span>
        <span className="block font-ca-mono text-[12px] text-ca-400">{coords}</span>
      </span>
    </button>
  );

  return (
    <Modal title={t("locationPicker.title")} icon="mappin" onClose={close}>
      {loading ? (
        <div className="py-10 text-center text-[13.5px] text-ca-500">{t("locationPicker.loading")}</div>
      ) : (
        <div className="flex flex-col gap-1">
          {current && (
            <Row color="#00a884" title={t("locationPicker.currentLocation")} coords={`X ${current.x} · Y ${current.y} · Z ${current.z}`} onClick={() => pick({ name: t("locationPicker.currentLocation"), ...current })} />
          )}
          {waypoints.map((w) => (
            <Row
              key={`${w.name}-${w.x}-${w.z}`}
              color={w.color || "#f97316"}
              title={w.name}
              coords={`X ${w.x} · Y ${w.y} · Z ${w.z}`}
              onClick={() => pick(w)}
            />
          ))}
          {waypoints.length === 0 && !current && (
            <div className="py-10 text-center text-[13.5px] text-ca-500">{t("locationPicker.noWaypoints")}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
