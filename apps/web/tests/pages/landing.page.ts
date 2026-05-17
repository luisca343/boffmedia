import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class LandingPage extends BasePage {
  readonly heroTitle: Locator
  readonly heroDescription: Locator
  readonly heroImage: Locator
  readonly exploreGamesLink: Locator
  readonly joinCommunityLink: Locator
  readonly featuredSectionHeading: Locator

  constructor(page: Page) {
    super(page)
    this.heroTitle = page.getByRole("heading", { name: /Your gaming adventure/i })
    this.heroDescription = page.getByText(/Immerse yourself/i)
    this.heroImage = page.getByRole("img", { name: "Gaming Illustration" })
    this.exploreGamesLink = page.getByRole("link", { name: "Explore Games" })
    this.joinCommunityLink = page.getByRole("link", { name: "Join the Community" })
    this.featuredSectionHeading = page.getByRole("heading", { name: "Featured Games and Tools" })
  }

  async goto() {
    await this.page.goto("/")
  }
}
