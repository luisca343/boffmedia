import { test, expect, type Page } from "@playwright/test"
import fs from "fs"
import path from "path"

/**
 * B15's remaining half: time-to-first-turn for the AI worker, measured in a
 * real browser.
 *
 * The card's other half — the chunk sizes — was measured from the build output
 * and closed: `@pkmn` is a 7,396 KB chunk plus an 1,844 KB companion,
 * uncompressed. That number was recorded with the caveat that it is a PROXY for
 * cold start, not a substitute, because it says nothing about how long the
 * worker takes to boot, parse and reach a first decision. This is the direct
 * measurement, and it needs exactly what B7 built: a real browser running the
 * package as a bundle, with a real Web Worker and no network.
 *
 * WHAT IS MEASURED
 *   cold  — the first launch of the session: lazy screen chunk + the worker
 *           script + `@pkmn` parse + team generation + the engine reaching a
 *           request for a choice. This is what a user pays on their first
 *           battle and is the number B15 is about.
 *   warm  — a second battle in the same page, with every chunk already in
 *           memory. The DIFFERENCE between the two is the download-and-parse
 *           cost; what remains in `warm` is the engine's own startup.
 *
 * Reporting both is the point. A single cold figure cannot tell you whether to
 * attack the bundle or the engine, which is the decision the number exists to
 * inform. First run, on this machine: cold 4,284 ms, warm 109 ms. The engine's
 * own startup is ~2.5% of a cold start; essentially all of it is module
 * loading, which is what makes the chunk half of B15 the right thing to have
 * measured and the right thing to attack.
 *
 * WHAT THE ABSOLUTE NUMBER IS NOT. The host is a Vite DEV server, so modules
 * arrive unbundled and compiled on demand -- `@pkmn/dex` shows up here as a
 * 2,301 KB dev artifact, not as the 7,396 KB production chunk the other half of
 * B15 measured from a real build. Treat `coldMs` as a same-machine trend line
 * and a smoke signal, never as the figure a user experiences. The cold/warm
 * SPLIT is the durable finding, because it is about where the time goes rather
 * than how much of it there is.
 *
 * The dev server also loads the full source barrels of `@boffmedia/ui` and
 * `@boffmedia/tools-pokemon` (ModBrowser, tcgp-kit and friends appear in the
 * resource list below), which a production build tree-shakes -- S11 measured
 * the battlesim routes at ~1.19 MB after its dynamic-import fix. Worth knowing
 * before reading anything into an unfamiliar name in the output.
 *
 * WHY THE CEILING IS ABSURD ON PURPOSE
 * A tuned threshold on a shared CI runner is a flake generator, and a flaky gate
 * gets disabled — after which it measures nothing while still looking like a
 * guard. So the assertion is a SMOKE CEILING: it catches "the worker no longer
 * boots" or "something now downloads the dex twice", not a 20% regression. The
 * numbers themselves are printed and written to `worker-cold-start.json` for a
 * human to compare across runs. This file is a measurement that cannot silently
 * stop measuring; it is not a benchmark, and it does not pretend to be one.
 */

const LAUNCH_AI = "tools.battlesim.app.lobby.launch.ia"
const TAB_HOME = "tools.battlesim.tabs.home"
const YOUR_TURN = /tabs\.state\.yourTurn/

/**
 * Generous enough that only a broken worker trips it. On this machine a cold
 * start lands around 5-10s; CI runners are slower and share a core.
 */
const COLD_CEILING_MS = 60_000
const WARM_CEILING_MS = 30_000

interface ResourceRow {
  name: string
  kb: number
  ms: number
}

/** Click launch and wait until the engine asks for a choice. */
async function timeToFirstTurn(page: Page): Promise<number> {
  const started = Date.now()
  await page.getByRole("button", { name: LAUNCH_AI }).click()
  await expect(page.getByRole("tab", { name: YOUR_TURN })).toBeVisible({
    timeout: COLD_CEILING_MS,
  })
  return Date.now() - started
}

/**
 * The heaviest scripts the page actually fetched.
 *
 * `transferSize` is 0 for a memory-cache hit, which is exactly how the warm
 * pass is distinguished from the cold one without trusting a stopwatch alone —
 * so this doubles as evidence that the second battle really did reuse the
 * chunks rather than merely being lucky.
 */
async function heaviestScripts(page: Page): Promise<ResourceRow[]> {
  return page.evaluate(() =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((e) => e.initiatorType === "script" || e.initiatorType === "other")
      .map((e) => ({
        name: e.name.split("/").pop() ?? e.name,
        kb: Math.round((e.encodedBodySize || e.transferSize) / 1024),
        ms: Math.round(e.duration),
      }))
      .filter((r) => r.kb > 100)
      .sort((a, b) => b.kb - a.kb)
      .slice(0, 8),
  )
}

test.describe("battlesim AI worker — cold start (B15)", () => {
  test("time-to-first-turn, cold and warm", async ({ page }, testInfo) => {
    // Slow by nature: this test deliberately pays the full cold cost once.
    test.setTimeout(COLD_CEILING_MS + WARM_CEILING_MS + 60_000)

    const pageErrors: string[] = []
    page.on("pageerror", (e) => pageErrors.push(e.message))

    await page.goto("/")
    await expect(page.getByRole("tab", { name: TAB_HOME })).toBeVisible({ timeout: 30_000 })

    // --- cold -------------------------------------------------------------
    const cold = await timeToFirstTurn(page)
    const scripts = await heaviestScripts(page)

    // --- warm -------------------------------------------------------------
    // Back to the lobby and launch again. Everything is in memory now, so what
    // is left is the engine's own startup rather than the bundle's.
    await page.getByRole("tab", { name: TAB_HOME }).click()
    await expect(page.getByRole("button", { name: LAUNCH_AI })).toBeEnabled()
    const warm = await timeToFirstTurn(page)

    const report = {
      measuredAt: new Date().toISOString(),
      coldMs: cold,
      warmMs: warm,
      // The bundle's share of the cold start. Negative would mean the warm run
      // was slower, which happens on a noisy runner and is reported honestly
      // rather than clamped to zero.
      bundleShareMs: cold - warm,
      heaviestScripts: scripts,
    }

    const line =
      `[B15] time-to-first-turn  cold ${cold} ms  warm ${warm} ms  ` +
      `(bundle share ${cold - warm} ms)`
    console.log(line)
    for (const s of scripts) console.log(`[B15]   ${String(s.kb).padStart(6)} KB  ${s.ms} ms  ${s.name}`)

    // Written where the HTML report is uploaded from, so a CI run carries the
    // numbers off the runner instead of leaving them in a log nobody keeps.
    fs.writeFileSync(
      path.resolve(__dirname, "..", "worker-cold-start.json"),
      JSON.stringify(report, null, 2),
    )
    await testInfo.attach("worker-cold-start.json", {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })

    // A battle that reached "your turn" while throwing is not a battle that
    // started, and the timing would be meaningless.
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(" | ")}`).toHaveLength(0)

    expect(cold, "the worker did not reach a first decision — cold start is broken").toBeLessThan(
      COLD_CEILING_MS,
    )
    expect(
      warm,
      "a warm launch cost as much as a cold one, so nothing is being reused",
    ).toBeLessThan(WARM_CEILING_MS)
  })
})
