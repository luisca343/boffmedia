import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "./proxy"
import { PATHNAME_HEADER } from "./i18n/scopes"
import { ALL_NAMESPACES } from "./i18n/manifest.generated"
import { namespacesFor } from "./i18n/scopes"

const request = (url: string, headers?: Record<string, string>) =>
  new NextRequest(new Request(url, { headers }))

// `x-middleware-request-<name>` is how a rewrite's `request.headers` reach the
// server component that calls `headers()`.
const publishedPathname = (res: Response | undefined) =>
  res?.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)

describe("proxy", () => {
  it("publishes the pathname so route-scoped messages engage", async () => {
    const res = await proxy(request("https://boffmedia.es/smartrotom/pokedex/entrada/25"))
    expect(publishedPathname(res)).toBe("/smartrotom/pokedex/entrada/25")
  })

  it("overwrites a client-sent header — it must not pick the namespaces", async () => {
    const res = await proxy(
      request("https://boffmedia.es/torneos", { [PATHNAME_HEADER]: "/smartrotom/pokedex" }),
    )
    expect(publishedPathname(res)).toBe("/torneos")
  })

  it("skips static files and _next without rewriting", async () => {
    expect(await proxy(request("https://boffmedia.es/logo.png"))).toBeUndefined()
    expect(await proxy(request("https://boffmedia.es/_next/static/x"))).toBeUndefined()
  })

  it("the published pathname narrows the namespace set", async () => {
    const res = await proxy(request("https://boffmedia.es/torneos"))
    const loaded = namespacesFor(publishedPathname(res) ?? "", ALL_NAMESPACES)
    expect(loaded.length).toBeLessThan(ALL_NAMESPACES.length)
  })
})
