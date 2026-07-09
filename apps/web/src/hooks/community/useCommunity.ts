"use client"

import { useEffect, useState } from "react"
import {
  CommunityService,
  type ActivityItem,
  type SiteStats,
} from "@/services/api/boffmedia/communityService"

/** Site-wide aggregate stats for the landing HUD. Null until loaded. */
export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let alive = true
    CommunityService.getSiteStats()
      .then((res) => {
        if (alive && res.data) setStats(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setIsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { stats, isLoading }
}

/** Site-wide recent activity for the landing feed. Empty until loaded. */
export function useSiteActivity(limit = 8) {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let alive = true
    CommunityService.getActivity(limit)
      .then((res) => {
        if (alive && res.data) setActivity(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setIsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [limit])

  return { activity, isLoading }
}
