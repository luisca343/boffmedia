// ---------------------------------------------------------------------------
// Shared HTTP utilities for manga scrapers.
// ---------------------------------------------------------------------------

import axios from 'axios';

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const DELAY_MS = { min: 300, max: 800 };
export const MAX_RETRIES = 2;

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(): Promise<void> {
  const ms = DELAY_MS.min + Math.random() * (DELAY_MS.max - DELAY_MS.min);
  return sleep(ms);
}

export async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: { 'User-Agent': UA },
    timeout: 15_000,
  });
  return data;
}
