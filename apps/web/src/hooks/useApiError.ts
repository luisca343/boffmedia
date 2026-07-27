"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import { isApiErrorCode } from "@boffmedia/shared/error-codes"
import { ApiError } from "@/services/http/core"

/**
 * The single home of API error -> user-facing text.
 *
 * The API attaches a stable `code` to every error that surfaces to a user and
 * keeps its Spanish `userMessage` as the fallback. This resolves, in order:
 *
 *   1. `apiErrors.<CODE>` from the locale catalog, when the code is known;
 *   2. the server's `userMessage`, for a code shipped before the web caught up;
 *   3. the caller's fallback, or the generic message.
 *
 * That ordering is what makes adding a code on the server safe: an unknown code
 * degrades to the server's Spanish text rather than to a raw key or blank.
 * Never render `error.message` — it is machine English meant for logs.
 */
export function useApiError() {
  const t = useTranslations("apiErrors")

  return useCallback(
    (error: unknown, fallback?: string): string => {
      const code = error instanceof ApiError ? error.code : undefined
      if (isApiErrorCode(code)) return t(code)

      const userMessage = error instanceof ApiError ? error.userMessage : undefined
      return userMessage ?? fallback ?? t("generic")
    },
    [t]
  )
}
