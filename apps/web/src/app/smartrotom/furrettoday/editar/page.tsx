"use client";

import { useRouter } from "next/navigation";

import { USER_ROLES } from "@boffmedia/shared/roles";
import { useBoffSession } from "@/services/useBoffSession";

import { EmptyState, Skeleton } from "../_components/ui";
import { Newsroom } from "./_components/Newsroom";

export default function EditarPage() {
  const router = useRouter();
  const { hasRole, status } = useBoffSession();
  const canManageNews = hasRole([USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <Skeleton className="h-[220px] w-full" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
          <Skeleton className="h-[560px] w-full" />
          <Skeleton className="h-[560px] w-full" />
        </div>
      </div>
    );
  }

  if (!canManageNews) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <EmptyState
          title="ACCESO DENEGADO"
          message="Necesitas el rol de redacción (ROTOM_ADMIN o ROTOM_FURRET) para entrar en la sala de redacción."
          actionLabel="Volver a portada"
          onAction={() => router.push("/smartrotom/furrettoday")}
        />
      </div>
    );
  }

  return <Newsroom />;
}
