import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { MhWildsService } from "@/services/api/tools/mhWildsService"
import type { MhMonster } from "@/types/tools/mhwilds"

export function useMonsters() {
  const locale = useLocale()
  const [monsters, setMonsters] = useState<MhMonster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMonsters = async () => {
    try {
      setLoading(true)
      const res = await MhWildsService.getMonsters(locale)
      if (!res.data) throw new Error("No data received from monsters API")
      setMonsters(Array.isArray(res.data) ? res.data : [])
      setError(null)
    } catch (err) {
      console.error("Error fetching monsters:", err)
      setError("Error loading bestiary data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonsters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  return { monsters, loading, error, refresh: fetchMonsters }
}
