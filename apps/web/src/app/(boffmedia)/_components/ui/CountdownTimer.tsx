"use client"

import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: string
  liveLabel: string
}

export function CountdownTimer({ targetDate, liveLabel }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return <span>{timeLeft ?? liveLabel}</span>
}

function computeTimeLeft(dateString: string): string | null {
  const diff = new Date(dateString).getTime() - Date.now()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}
