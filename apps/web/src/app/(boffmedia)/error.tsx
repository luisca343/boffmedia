"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/primitives/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { FloatingBackground } from "./_components/layout/FloatingBackground";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-panel via-base to-panel overflow-hidden flex items-center justify-center">
      <FloatingBackground hue={30} />

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-md mx-auto text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-danger to-warning inline-block mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-danger-hover to-warning-hover mb-2">
              {t("error.title")}
            </h1>
            <p className="text-txt">
              {t("error.body")}
            </p>
          </div>

          {/* Error Details */}
          <div className="mb-6 p-4 bg-panel-2/30 rounded-lg border border-line/50 backdrop-blur-sm text-left">
            <div className="mb-3">
              <span className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                {t("error.messageLabel")}
              </span>
              <p className="mt-1 text-sm text-txt font-mono leading-relaxed break-words">
                {error.message || t("error.unknown")}
              </p>
            </div>

            {error.digest && (
              <div>
                <span className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                  {t("error.trackingId")}
                </span>
                <p className="mt-1 text-xs text-txt font-mono">
                  {error.digest}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-accent to-orange-500 hover:from-accent-bright hover:to-orange-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("error.retry")}
            </Button>

            <Button variant="outline" className="border-line" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t("error.home")}
              </Link>
            </Button>
          </div>

          {/* Support Link */}
          <p className="text-xs text-txt-muted">
            {t("error.helpText")}{" "}
            <Link
              href="https://discord.com/invite/R7MEDDSM5C"
              className="text-accent-bright hover:text-accent-bright underline"
            >
              {t("error.discordLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}