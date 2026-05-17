import { test as base, expect } from "@playwright/test"
import { LandingPage } from "../pages/boffmedia/landing.page"
import { AuthPage } from "../pages/boffmedia/auth.page"
import { ProfilePage } from "../pages/boffmedia/profile.page"

type Pages = {
  landingPage: LandingPage
  authPage: AuthPage
  profilePage: ProfilePage
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
})

export { expect }
