import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

test.use({ storageState: { cookies: [], origins: [] } })

const EVENTS_URL = "https://api.ficuslab.es/events"

const mockEvent = {
  id: 1,
  title: "Torneo de Minecraft",
  description: "Compite en el mejor torneo de Minecraft",
  status: "upcoming",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-07T00:00:00.000Z",
  game: { title: "Minecraft", type: "survival" },
  bannerUrl: null,
  type: "tournament",
}

test.describe("Events page — with events", () => {
  test.beforeEach(async ({ eventsPage, page }) => {
    await mockGet(page, EVENTS_URL, apiOk([mockEvent]))
    await eventsPage.goto()
  })

  test("heading and search are visible", { tag: "@smoke" }, async ({ eventsPage }) => {
    await expect(eventsPage.heading).toBeVisible()
    await expect(eventsPage.searchInput).toBeVisible()
  })

  test("renders event title from API response", async ({ eventsPage }) => {
    await expect(eventsPage.eventTitles.filter({ hasText: "Torneo de Minecraft" })).toBeVisible()
  })

  test("renders a See Details link for each event", async ({ eventsPage }) => {
    await expect(eventsPage.seeDetailsLinks.first()).toBeVisible()
  })
})

test.describe("Events page — empty state", () => {
  test.beforeEach(async ({ eventsPage, page }) => {
    await mockGet(page, EVENTS_URL, apiOk([]))
    await eventsPage.goto()
  })

  test("shows empty state when no events exist", async ({ eventsPage }) => {
    await expect(eventsPage.noEventsMessage).toBeVisible()
  })
})
