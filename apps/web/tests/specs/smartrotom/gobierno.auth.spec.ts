import { test, expect } from "../../fixtures"

// Gobierno de Teras is staff-gated: GOBIERNO / GOB_* role, or ROTOM_ADMIN.
// These are smoke checks that the app actually paints — that the `gt-*` scope root
// resolves, the three self-hosted faces load, and no module throws on first render.

const DEPARTMENTS = [
  ["", "Inicio"],
  ["/mapa", "Mapa"],
  ["/parcelas", "Parcelas"],
  ["/denuncias", "Denuncias"],
  ["/multas", "Multas"],
  ["/tesoreria", "Tesorería"],
  ["/expedientes", "Expedientes"],
  ["/censo", "Censo"],
  ["/eventos", "Eventos"],
  ["/auditoria", "Auditoría"],
] as const

test.describe("Gobierno de Teras — authenticated", () => {
  test("the scope root mounts and the seal renders", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/smartrotom/gobierno")

    // The scope root is what makes every `gt-*` token resolve — without it the whole
    // app renders with unresolved CSS vars and looks unstyled.
    const root = page.locator(".gt-app").first()
    await expect(root).toBeVisible()
    await expect(root).toHaveAttribute("data-accent", /civic|navy|burgundy|gold/)

    await expect(page.getByRole("heading", { name: "Gobierno de Teras" })).toBeVisible()
    await expect(page.getByLabel("Sello del Gobierno de Teras").first()).toBeVisible()
  })

  test("the three self-hosted faces actually load", async ({ page }) => {
    await page.goto("/smartrotom/gobierno")
    await expect(page.locator(".gt-app").first()).toBeVisible()

    // Turbopack drops an external @import silently, so a font that "works" in the
    // stylesheet can still be absent at runtime. Ask the browser, not the CSS.
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready
      const families = new Set<string>()
      document.fonts.forEach((f) => f.status === "loaded" && families.add(f.family.replace(/"/g, "")))
      return [...families]
    })

    expect(loaded).toContain("Libre Baskerville")
    expect(loaded).toContain("Public Sans")
    expect(loaded).toContain("Space Mono")
  })

  test("the department nav lists every group", async ({ page }) => {
    await page.goto("/smartrotom/gobierno")
    const nav = page.getByRole("navigation", { name: "Departamentos" })
    await expect(nav).toBeVisible()

    for (const group of ["Resumen", "Urbanismo", "Seguridad", "Hacienda", "Justicia", "Población", "Gobierno"]) {
      await expect(nav.getByText(group, { exact: true })).toBeVisible()
    }
  })

  for (const [slug, label] of DEPARTMENTS) {
    test(`${label} renders with no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
      page.on("pageerror", (e) => errors.push(e.message))

      await page.goto(`/smartrotom/gobierno${slug}`)
      await expect(page.locator(".gt-app").first()).toBeVisible()
      // Let the queries settle so a failed fetch surfaces as an error, not a race.
      await page.waitForTimeout(1500)

      expect(errors, `console errors on ${label}:\n${errors.join("\n")}`).toEqual([])
    })
  }

  test("⌘K opens the command palette over every module", async ({ page }) => {
    await page.goto("/smartrotom/gobierno")
    await expect(page.locator(".gt-app").first()).toBeVisible()

    await page.keyboard.press("ControlOrMeta+k")
    const palette = page.getByRole("dialog", { name: "Buscar en el gobierno" })
    await expect(palette).toBeVisible()

    // A portal escapes `.gt-app`; ThemedLayer must put the scope back or this renders
    // with every token unresolved.
    await expect(palette.locator("xpath=ancestor::div[contains(@class,'gt-app')]")).toHaveCount(1)

    await palette.getByRole("textbox").fill("tesor")
    await expect(palette.getByText("Tesorería")).toBeVisible()
  })
})
