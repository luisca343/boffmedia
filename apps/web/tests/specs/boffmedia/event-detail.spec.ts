import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

test.use({ storageState: { cookies: [], origins: [] } })

const EVENT_ID = 1

const mockEvent = {
  id: EVENT_ID,
  title: "Torneo de Minecraft",
  description: "Un emocionante torneo de Minecraft",
  status: "upcoming",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-07T00:00:00.000Z",
  gameId: 1,
  gameName: "Minecraft",
}

const mockParticipant = {
  id: 1,
  nickname: "AshKetchum",
  userId: 1,
}

const mockAchievement = {
  id: 1,
  name: "Primera Victoria",
  description: "Gana tu primer evento",
  points: 100,
  itemType: "achievement",
  rarity: "common",
  maxProgress: 1,
  hidden: false,
}

const mockLeaderboardEntry = {
  userId: 1,
  nickname: "AshKetchum",
  totalPoints: 100,
  medalPoints: 50,
  achievementPoints: 50,
  medalCount: 1,
  achievementCount: 1,
}

test.describe("Event detail page — with data", () => {
  test.beforeEach(async ({ eventDetailPage, page }) => {
    await mockGet(page, `https://api.ficuslab.es/events/event/${EVENT_ID}`, apiOk(mockEvent))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/participants`, apiOk([mockParticipant]))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/achievements`, apiOk([mockAchievement]))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/leaderboard`, apiOk([mockLeaderboardEntry]))
    await eventDetailPage.goto(EVENT_ID)
  })

  test("shows event title as page heading", { tag: "@smoke" }, async ({ eventDetailPage }) => {
    await expect(eventDetailPage.eventTitle).toHaveText("Torneo de Minecraft")
  })

  test("back link to events list is visible", async ({ eventDetailPage }) => {
    await expect(eventDetailPage.backLink).toBeVisible()
  })

  test("participants section is visible", async ({ eventDetailPage }) => {
    await expect(eventDetailPage.participantsHeading).toBeVisible()
  })

  test("achievements section is visible", async ({ eventDetailPage }) => {
    await expect(eventDetailPage.achievementsHeading).toBeVisible()
  })

  test("leaderboard section is visible", async ({ eventDetailPage }) => {
    await expect(eventDetailPage.leaderboardHeading).toBeVisible()
  })
})

test.describe("Event detail page — empty participants", () => {
  test.beforeEach(async ({ eventDetailPage, page }) => {
    await mockGet(page, `https://api.ficuslab.es/events/event/${EVENT_ID}`, apiOk(mockEvent))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/participants`, apiOk([]))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/achievements`, apiOk([]))
    await mockGet(page, `https://api.ficuslab.es/events/${EVENT_ID}/leaderboard`, apiOk([]))
    await eventDetailPage.goto(EVENT_ID)
  })

  test("shows empty participants message", async ({ eventDetailPage }) => {
    await expect(eventDetailPage.emptyParticipantsMessage).toBeVisible()
  })
})
