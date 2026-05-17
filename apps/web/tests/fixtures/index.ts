import { test as base, expect } from "@playwright/test"
import { LandingPage } from "../pages/boffmedia/landing.page"
import { AuthPage } from "../pages/boffmedia/auth.page"
import { ProfilePage } from "../pages/boffmedia/profile.page"
import { EventsPage } from "../pages/boffmedia/events.page"
import { LeaderboardPage } from "../pages/boffmedia/leaderboard.page"
import { SmartRotomHomePage } from "../pages/smartrotom/home.page"

type Pages = {
  landingPage: LandingPage
  authPage: AuthPage
  profilePage: ProfilePage
  eventsPage: EventsPage
  leaderboardPage: LeaderboardPage
  smartRotomHomePage: SmartRotomHomePage
}

export const test = base.extend<Pages>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page))
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page))
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page))
  },
  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page))
  },
  leaderboardPage: async ({ page }, use) => {
    await use(new LeaderboardPage(page))
  },
  smartRotomHomePage: async ({ page }, use) => {
    await use(new SmartRotomHomePage(page))
  },
})

export { expect }
