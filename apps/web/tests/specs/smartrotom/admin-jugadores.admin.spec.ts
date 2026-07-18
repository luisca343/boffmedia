import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"
import { ADMIN_MARKER, expectBouncedFromAdmin, expectOnAdminSurface } from "../../helpers/pageMarker"

const USERS_URL = "https://api.ficuslab.es/smartrotom/users"
const OFICIALES_URL = "https://api.ficuslab.es/smartrotom/gobierno/poblacion/oficiales"

const online = {
  id: 1,
  uuid: "aaaa1111-0000-0000-0000-000000000001",
  username: "ProfesorFicus",
  world: "world",
  energy: 10,
  lastCharge: "2026-07-12T10:00:00.000Z",
}

const offline = {
  id: 2,
  uuid: "bbbb2222-0000-0000-0000-000000000002",
  username: "EntrenadorRaro",
  energy: 3,
  lastCharge: "2026-07-11T10:00:00.000Z",
}

const oficial = {
  uuid: online.uuid,
  username: online.username,
  roles: ["GOB_INSPECTOR"],
  rank: { role: "GOB_INSPECTOR", label: "Inspector", prefix: "I" },
}

test.describe("Admin — Jugadores (Gobierno de Teras)", () => {
  test.beforeEach(async ({ page }) => {
    await mockGet(page, USERS_URL, apiOk([online, offline]))
    await mockGet(page, OFICIALES_URL, apiOk([oficial]))
  })

  test("is actually on the authorised admin surface", { tag: "@smoke" }, async ({ adminJugadoresPage, page }) => {
    await adminJugadoresPage.goto()

    await expect(page.locator(ADMIN_MARKER)).toHaveCount(1)
    await expect(page.getByRole("heading", { name: "Jugadores", exact: true })).toBeVisible()
    await expect(page.getByText("Registro de jugadores")).toBeVisible()
  })

  test("lists every player the admin users endpoint returns", async ({ adminJugadoresPage }) => {
    await adminJugadoresPage.goto()

    await expect(adminJugadoresPage.rows).toHaveCount(2)
    await expect(adminJugadoresPage.rowFor("ProfesorFicus")).toBeVisible()
    await expect(adminJugadoresPage.rowFor("EntrenadorRaro")).toBeVisible()
  })

  test("shows each player's government rank, or a dash when they hold none", async ({ adminJugadoresPage }) => {
    await adminJugadoresPage.goto()

    await expect(adminJugadoresPage.rowFor("ProfesorFicus")).toContainText("Inspector")
    await expect(adminJugadoresPage.rowFor("EntrenadorRaro")).not.toContainText("Inspector")
  })

  test("filters the roster by connection state", async ({ adminJugadoresPage }) => {
    await adminJugadoresPage.goto()

    await adminJugadoresPage.onlineFilter.click()
    await expect(adminJugadoresPage.rows).toHaveCount(1)
    await expect(adminJugadoresPage.rowFor("ProfesorFicus")).toBeVisible()

    await adminJugadoresPage.offlineFilter.click()
    await expect(adminJugadoresPage.rows).toHaveCount(1)
    await expect(adminJugadoresPage.rowFor("EntrenadorRaro")).toBeVisible()

    await adminJugadoresPage.allFilter.click()
    await expect(adminJugadoresPage.rows).toHaveCount(2)
  })

  test("searches by username and by uuid", async ({ adminJugadoresPage }) => {
    await adminJugadoresPage.goto()

    await adminJugadoresPage.searchInput.fill("EntrenadorRaro")
    await expect(adminJugadoresPage.rows).toHaveCount(1)

    await adminJugadoresPage.searchInput.fill(online.uuid)
    await expect(adminJugadoresPage.rows).toHaveCount(1)
    await expect(adminJugadoresPage.rowFor("ProfesorFicus")).toBeVisible()

    await adminJugadoresPage.searchInput.fill("nadie-con-este-nombre")
    await expect(adminJugadoresPage.rows).toHaveCount(0)
    await expect(adminJugadoresPage.page.getByText("Sin jugadores")).toBeVisible()
  })

  test("opens and closes a player's dossier", async ({ adminJugadoresPage }) => {
    await adminJugadoresPage.goto()

    await expect(adminJugadoresPage.dossier).toBeHidden()
    await adminJugadoresPage.rowFor("ProfesorFicus").click()
    await expect(adminJugadoresPage.dossier).toBeVisible()

    await adminJugadoresPage.closeDossier.click()
    await expect(adminJugadoresPage.dossier).toBeHidden()
  })

  // Proves the marker is load-bearing rather than always-present: strip the session and
  // the very same navigation must NOT reach the admin surface. If this ever passes with
  // the marker still attached, the gate has stopped working.
  test("the admin gate bounces a session without the role", async ({ browser }) => {
    const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await anonymous.newPage()
    await mockGet(page, USERS_URL, apiOk([online, offline]))
    await mockGet(page, OFICIALES_URL, apiOk([oficial]))

    await page.goto("/smartrotom/gobierno/admin/jugadores")
    await page.waitForTimeout(2500)
    await expectBouncedFromAdmin(page)

    await anonymous.close()
  })
})

test.describe("Admin — the marker guard itself", () => {
  test("expectOnAdminSurface rejects a URL that is not the requested tool", async ({ page }) => {
    await mockGet(page, USERS_URL, apiOk([online]))
    await page.goto("/smartrotom/gobierno/admin/jugadores")

    // Right surface, wrong tool — the URL half of the guard must catch this.
    await expect(expectOnAdminSurface(page, "notificaciones")).rejects.toThrow()
  })
})
