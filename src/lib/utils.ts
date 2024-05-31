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

export function  secondsToTime (segundos : number) {
  // Obtener a partir de los segundos, los minutos, horas y días
  const dias = Math.floor(segundos / (3600 * 24))
  const horas = Math.floor(segundos / 3600) % 24
  const minutos = Math.floor(segundos / 60) % 60
  let segundosRestantes = segundos % 60

  segundosRestantes = parseInt(segundosRestantes.toFixed(2))


  // Formatear los resultados
  return `${dias > 0 ? dias + 'd ' : ''}${horas > 0 ? horas + 'h ' : ''}${minutos > 0 ? minutos + 'm ' : ''}${segundosRestantes > 0 ? segundosRestantes + 's ' : ''}`
}