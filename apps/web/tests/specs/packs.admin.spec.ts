import { expect, test } from "@playwright/test"

// The launcher pack registry admin section (HANDOFF §7). Runs under the
// chromium:admin project, which mints a REAL credentials session — see
// tests/admin.setup.ts on why a forged cookie is not acceptable here.
//
// This spec talks to the live API and writes to the dev database, so it uses a
// per-run slug and archives what it creates. Archiving rather than deleting is
// deliberate: it is the only teardown the API offers, because pack_audit has to
// outlive the pack.

test.describe("admin · launcher packs", () => {
  test("renders the section with its KPIs and empty detail state", async ({ page }) => {
    await page.goto("/admin?section=packs")

    await expect(
      page.getByRole("heading", { name: /packs del launcher|launcher packs/i }),
    ).toBeVisible()

    // The KPI tiles are computed from the list response, so they cannot render
    // before it lands — the cheapest proof the request resolved.
    await expect(page.getByText(/versiones|versions/i).first()).toBeVisible()

    // Nothing selected yet.
    await expect(page.getByText(/selecciona un pack|select a pack/i)).toBeVisible()
  })

  test("creates a pack, rejects a duplicate slug, then archives it", async ({ page }) => {
    // Unique per run: the slug is UNIQUE server-side, and a fixed one makes the
    // second run fail on the first run's leftovers.
    // The name deliberately does NOT contain the slug: otherwise getByText(slug)
    // matches the list entry and the detail line both, and strict mode fails.
    const stamp = Date.now().toString(36)
    const slug = `e2e-pack-${stamp}`
    const name = `E2E Check ${stamp}`

    await page.goto("/admin?section=packs")

    const openCreate = async () =>
      page.getByRole("button", { name: /nuevo pack|new pack/i }).first().click()

    await openCreate()
    let dialog = page.getByRole("dialog")
    await dialog.getByPlaceholder("Boff SMP").fill(name)
    await dialog.getByPlaceholder("boff-smp").fill(slug)
    await dialog.getByRole("button", { name: /^crear$|^create$/i }).click()

    // Dialog closes only on success.
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    const entry = page.getByRole("button", { name: new RegExp(name, "i") })
    await expect(entry).toBeVisible({ timeout: 10_000 })

    // The slug is UNIQUE — a second attempt must be refused and the dialog must
    // stay open so the work is not lost.
    await openCreate()
    dialog = page.getByRole("dialog")
    await dialog.getByPlaceholder("Boff SMP").fill(name)
    await dialog.getByPlaceholder("boff-smp").fill(slug)
    await dialog.getByRole("button", { name: /^crear$|^create$/i }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: /cancelar|cancel/i }).click()
    await expect(dialog).not.toBeVisible()

    // Open it: the detail pane swaps the empty state for the tabs.
    await entry.click()
    await expect(page.getByText(slug)).toBeVisible()

    // A brand-new pack has no versions and no grants — the copy should say so
    // rather than rendering an empty table.
    await expect(page.getByText(/sin versiones|no versions/i)).toBeVisible()
    await page.getByRole("tab", { name: /acceso|access/i }).click()
    await expect(page.getByText(/nadie tiene acceso|nobody has access/i)).toBeVisible()

    // Teardown.
    await page.getByRole("button", { name: /archivar|^archive$/i }).click()
    await expect(entry).not.toBeVisible({ timeout: 10_000 })
  })
})
