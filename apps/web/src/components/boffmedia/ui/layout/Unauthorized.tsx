"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const t = useTranslations("boffmedia");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <ShieldOff className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-txt mb-2">{t("unauthorized.title")}</h1>
        <p className="text-sm text-txt-muted mb-7 leading-relaxed">
          {t("unauthorized.body")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-line text-txt text-sm font-medium hover:bg-panel-2 hover:text-txt transition-colors"
          >
            {t("unauthorized.back")}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-accent/15 border border-accent/40 text-accent-bright text-sm font-medium hover:bg-accent/25 transition-colors"
          >
            {t("unauthorized.home")}
          </button>
        </div>
      </div>
    </div>
  );
}
