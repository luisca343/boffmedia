"use client";

import Link from "next/link";
import { Sparkles, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/primitives/button";
import { FloatingBackground } from "@/app/(boffmedia)/_components/layout/FloatingBackground";

interface ConstructionProps {
  title?: string;
  message?: string;
  showReload?: boolean;
  showHome?: boolean;
  discordUrl?: string;
}

export default function Construction({
  title,
  message,
  showReload = true,
  showHome = true,
  discordUrl = "https://discord.com/invite/R7MEDDSM5C",
}: ConstructionProps) {
  const t = useTranslations("common.construction");
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-layer-1 via-base to-layer-1 overflow-hidden flex items-center justify-center">
      <FloatingBackground hue={30} />

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="p-5 rounded-full bg-gradient-to-r from-primary to-orange-400 inline-block mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-hover to-orange-400 mb-2">
              {title ?? t("title")}
            </h1>
            <p className="text-ink">{message ?? t("message")}</p>
          </div>

          <div className="mb-6 p-4 bg-layer-2/20 rounded-lg border border-edge/40">
            <p className="text-sm text-ink font-mono break-words">
              {t("discordText")}{' '}
              <Link href={discordUrl} className="underline text-primary-hover">
                {t("discordLink")}
              </Link>
              .
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-6">
            {showHome && (
              <Button variant="outline" className="border-edge" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t("goHome")}
                </Link>
              </Button>
            )}

            {showReload && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary-active hover:to-orange-600"
              >
                {t("reload")}
              </Button>
            )}
          </div>

          <p className="text-xs text-ink-muted">{t("thanks")}</p>
        </div>
      </div>
    </div>
  );
}
