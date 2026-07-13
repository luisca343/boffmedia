"use client"

// The media apps (Mewtube + Mewtwitch) used the same defaults as every other
// SmartRotom app's scoped query client, just under a local name — this re-exports
// the shared one so `mewtube`/`mewtwitch`'s layout imports don't have to change.
export { AppQueryProvider as MediaQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"

/** fetch that throws uniformly on a non-2xx (so react-query sees the error). */
export async function mediaFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}
