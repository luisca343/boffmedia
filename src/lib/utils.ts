import { SmartRotomUser } from "@/types"
import { type ClassValue, clsx } from "clsx"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { twMerge } from "tailwind-merge"

import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
  classGroups: {
    // @ts-ignore
    'text-shadow': ['text-shadow-border1', 'text-shadow-border2', 'text-shadow-custom'],
  },
  conflictingClassGroups: {
    // @ts-ignore
    'text-color': ['text-shadow'],
  }
}
});


export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
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

export function parseDate (date: string | Date) {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
}


export const subdomains = ['smartrotom', 'battlesim'];

export function relativeRedirect(router: AppRouterInstance, url: string) {
  const subdomain = window.location.host.split('.')[0];
  const currentApp = window.location.pathname.split('/')[1];

  for (let s of subdomains) {
      if (subdomain === s) {
          return (
              router.push(url)
          );
      }
  }

  return (
    router.push(`/${currentApp}/${url}`)
  );
}

export function firstToUpper(str: string) {
  return str
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function padWithZeroes(num: number, length: number) {
  return num.toString().padStart(length, '0');
}

export function realTimeToMCTime(hours: number, minutes: number): number {
  let mcTime = (hours * 1000 + minutes * 100 / 6 - 6000) % 24000;
  if (mcTime < 0) {
    mcTime += 24000;
  }
  return mcTime;
}


export function mcTimeToRealTime(mcTime: number): string {
  mcTime = (mcTime + 6000) % 24000;
  if (mcTime < 0) {
    mcTime += 24000;
  }

  const totalMinutes = mcTime * 6 / 100;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  return `${padWithZeroes(hours, 2)}:${padWithZeroes(minutes, 2)}`;
}

export function mcTimeToRealTimeWithExtraDays(mcTime: number): string {
  mcTime = (mcTime + 6000) % 24000;
  if (mcTime < 0) {
    mcTime += 24000;
  }

  const totalMinutes = mcTime * 6 / 100;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const days = Math.floor(hours / 24);
  const daysTxt = days > 0 ? `(+${days} días)` : '';

  return `${padWithZeroes(hours, 2)}:${padWithZeroes(minutes, 2)} ${daysTxt}`;
}

export function getClearTime(timeToClear: number, currentTime: number){
  let timeToClearInMC = (currentTime + timeToClear) % 24000;
  return mcTimeToRealTime(timeToClearInMC);
}