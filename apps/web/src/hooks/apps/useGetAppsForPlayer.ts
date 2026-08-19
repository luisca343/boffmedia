import { useSession } from "next-auth/react"
import { useRotomRequestGated } from "../useRotomRequest"
import { AppsService } from "@/services/api/smartrotom/appsService"

/**
 * The dock's app list. `AppsService.getForPlayer` is an authed POST — the owner
 * is taken from the session server-side — so it must not fire before the access
 * token is readable. Without the gate the first open after a server boot 401'd
 * and, since the underlying hook never retries, the dock stayed empty until the
 * phone was reopened.
 */
export function useGetAppsForPlayer(uuid: string) {
  const { data: session, status } = useSession()
  const hasToken =
    status === "authenticated" &&
    Boolean((session?.user as { accessToken?: string } | undefined)?.accessToken)

  const { data, error, isLoading, refetch, setData } = useRotomRequestGated(
    hasToken,
    AppsService.getForPlayer,
    uuid,
  )

  return {
    apps: data || [],
    error,
    isLoading: isLoading || !hasToken,
    refetch,
    setApps: setData,
  }
}
