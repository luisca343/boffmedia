import { SmartRotomUser } from "@/types"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function strToDate(date: string) {
  const dateObj =  new Date(date)
  return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
}

export function getSmartRotomUser(session: any) {
  return session?.user?.smartRotomUser as SmartRotomUser
}