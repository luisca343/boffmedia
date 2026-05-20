import { test as base, expect } from "@playwright/test"
import { LandingPage } from "../pages/boffmedia/landing.page"
import { AuthPage } from "../pages/boffmedia/auth.page"
import { ProfilePage } from "../pages/boffmedia/profile.page"
import { EventsPage } from "../pages/boffmedia/events.page"
import { EventDetailPage } from "../pages/boffmedia/event-detail.page"
import { LeaderboardPage } from "../pages/boffmedia/leaderboard.page"
import { GamesPage } from "../pages/boffmedia/games.page"
import { CommunityPage } from "../pages/boffmedia/community.page"
import { ToolsPage } from "../pages/boffmedia/tools.page"
import { SmartRotomHomePage } from "../pages/smartrotom/home.page"
import { PokedexPage } from "../pages/smartrotom/pokedex.page"
import { PokedexEntryPage } from "../pages/smartrotom/pokedex-entry.page"
import { FurretTodayPage } from "../pages/smartrotom/furrettoday.page"
import { StarbankPage } from "../pages/smartrotom/starbank.page"
import { MisionesPage } from "../pages/smartrotom/misiones.page"
import { PasaportePage } from "../pages/smartrotom/pasaporte.page"
import { NotificationsPage } from "../pages/smartrotom/notifications.page"

type Pages = {
  landingPage: LandingPage
  authPage: AuthPage
  profilePage: ProfilePage
  eventsPage: EventsPage
  eventDetailPage: EventDetailPage
  leaderboardPage: LeaderboardPage
  gamesPage: GamesPage
  communityPage: CommunityPage
  toolsPage: ToolsPage
  smartRotomHomePage: SmartRotomHomePage
  pokedexPage: PokedexPage
  pokedexEntryPage: PokedexEntryPage
  furretTodayPage: FurretTodayPage
  starbankPage: StarbankPage
  misionesPage: MisionesPage
  pasaportePage: PasaportePage
  notificationsPage: NotificationsPage
}

export const test = base.extend<Pages>({
  landingPage: async ({ page }, use) => { await use(new LandingPage(page)) },
  authPage: async ({ page }, use) => { await use(new AuthPage(page)) },
  profilePage: async ({ page }, use) => { await use(new ProfilePage(page)) },
  eventsPage: async ({ page }, use) => { await use(new EventsPage(page)) },
  eventDetailPage: async ({ page }, use) => { await use(new EventDetailPage(page)) },
  leaderboardPage: async ({ page }, use) => { await use(new LeaderboardPage(page)) },
  gamesPage: async ({ page }, use) => { await use(new GamesPage(page)) },
  communityPage: async ({ page }, use) => { await use(new CommunityPage(page)) },
  toolsPage: async ({ page }, use) => { await use(new ToolsPage(page)) },
  smartRotomHomePage: async ({ page }, use) => { await use(new SmartRotomHomePage(page)) },
  pokedexPage: async ({ page }, use) => { await use(new PokedexPage(page)) },
  pokedexEntryPage: async ({ page }, use) => { await use(new PokedexEntryPage(page)) },
  furretTodayPage: async ({ page }, use) => { await use(new FurretTodayPage(page)) },
  starbankPage: async ({ page }, use) => { await use(new StarbankPage(page)) },
  misionesPage: async ({ page }, use) => { await use(new MisionesPage(page)) },
  pasaportePage: async ({ page }, use) => { await use(new PasaportePage(page)) },
  notificationsPage: async ({ page }, use) => { await use(new NotificationsPage(page)) },
})

export { expect }
