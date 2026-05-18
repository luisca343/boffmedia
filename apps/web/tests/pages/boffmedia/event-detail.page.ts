import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class EventDetailPage extends BasePage {
  readonly eventTitle: Locator
  readonly backLink: Locator
  readonly participantsHeading: Locator
  readonly achievementsHeading: Locator
  readonly leaderboardHeading: Locator
  readonly shareButton: Locator
  readonly emptyParticipantsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.eventTitle = page.getByRole("heading", { level: 1 })
    this.backLink = page.getByText("Volver a eventos")
    this.participantsHeading = page.getByRole("heading", { name: "Participantes" })
    this.achievementsHeading = page.getByRole("heading", { name: "Logros" })
    this.leaderboardHeading = page.getByRole("heading", { name: "Clasificación" })
    this.shareButton = page.getByRole("button", { name: /Compartir/i })
    this.emptyParticipantsMessage = page.getByText("Sin participantes aún")
  }

  async goto(id: number = 1) {
    await this.page.goto(`/eventos/${id}`)
  }
}
