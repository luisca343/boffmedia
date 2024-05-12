import { SmartRotomUser } from "@/types"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function strToDate(date: string) {
  if(!date) return ""
  const dateObj =  new Date(date)
  return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
}

export function strToTime(date: string) {
  if(!date) return ""
  return new Date(date).toLocaleTimeString()
}

export function getSmartRotomUser(session: any) {
  return session?.user?.smartRotomUser as SmartRotomUser
}