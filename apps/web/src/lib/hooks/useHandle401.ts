import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { ApiError } from "@/services/http/core"
import { useSessionExpired } from "@/features/SessionExpiredContext"

/**
 * Hook to detect 401 errors and trigger the session expired dialog.
 * Distinguishes between:
 * - Pending 2FA: Never shows dialog (handled by TwoFactorGate)
 * - Refreshable session: Would retry after refresh; for now shows dialog
 * - Expired session: Genuinely needs re-authentication
 *
 * Call this in error handlers (query onError, mutation onError, etc.)
 *
 * Returns true if the error was a 401 and was handled; false otherwise.
 */
export function useHandle401(): (error: unknown) => boolean {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { openDialog } = useSessionExpired()

  return (error: unknown) => {
    // Not an API error, or not a 401
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return false
    }

    // Pending 2FA: don't show dialog. TwoFactorGate will redirect to /entrar/2fa.
    // A 401 here is expected—pending sessions have no accessToken.
    if (session?.user?.twoFactorPending) {
      return true // Still mark as handled to prevent generic error toast
    }

    // Session exists but access denied: likely refreshable or expired.
    // For this vertical slice, we show the dialog in both cases.
    // In future, we could wait for session refresh before showing.
    if (session?.user) {
      openDialog("expired", pathname)
      return true
    }

    // No session at all: show dialog
    openDialog("expired", pathname)
    return true
  }
}
