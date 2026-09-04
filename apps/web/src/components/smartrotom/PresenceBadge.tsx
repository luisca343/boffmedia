"use client";

import { useTranslations } from "next-intl";
import { SmartRotomBadge } from "./ui/badge";
import type { PresenceStatus } from "@/types/presence";

interface PresenceBadgeProps {
  status: PresenceStatus;
  className?: string;
}

/**
 * Online status badge using SmartRotom design system.
 * Shows a colored badge with the user's presence status.
 */
export function PresenceBadge({ status, className }: PresenceBadgeProps) {
  const t = useTranslations("smartrotom.presence");

  const variant =
    status === "offline"
      ? "neutral"
      : status === "ingame"
        ? "default"
        : "button";

  const label = t(status);

  return (
    <SmartRotomBadge variant={variant} className={className}>
      {label}
    </SmartRotomBadge>
  );
}
