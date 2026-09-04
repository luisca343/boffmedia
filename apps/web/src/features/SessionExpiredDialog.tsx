"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useSessionExpired } from "./SessionExpiredContext"

/**
 * Dialog shown when a session expires or becomes invalid.
 * Distinguishes between:
 * - "refreshable": Session can be refreshed on next request
 * - "expired": Refresh token is dead (reuse detected, invalid, 2FA required)
 * - "pending-2fa": Never shown—handled by TwoFactorGate redirect instead
 *
 * Preserves intent by redirecting back to the current page after sign-in.
 */
export function SessionExpiredDialog() {
  const t = useTranslations("auth.sessionExpired")
  const router = useRouter()
  const { isOpen, caseType, currentPath, closeDialog } = useSessionExpired()

  const handleSignIn = () => {
    closeDialog()

    // Redirect to /entrar with return URL so user comes back to what they were doing.
    const target = currentPath && currentPath !== "/entrar"
      ? `/entrar?redirect=${encodeURIComponent(currentPath)}`
      : "/entrar"

    router.push(target)
  }

  if (!isOpen || !caseType || caseType === "pending-2fa") return null

  // For now, both refreshable and expired show the same message.
  // In future, "refreshable" could auto-retry after refresh succeeds.
  const title = t("title")
  const message = t("message")

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-sm">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={closeDialog}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSignIn}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {t("signIn")}
          </button>
        </div>
      </div>
    </div>
  )
}
