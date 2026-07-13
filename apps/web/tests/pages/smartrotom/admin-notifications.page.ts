import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

// Points at the Gobierno de Teras "Notificaciones" tool — the successor to
// /smartrotom/admin/notifications, ported into apps/web/src/app/smartrotom/gobierno/admin/
// notificaciones. The old page had a manual "type UUID" fallback input and inline
// green/red status text; the new one is search-only (select a player from the results)
// and reports success/failure via the app's toast host instead.
export class AdminNotificationsPage extends BasePage {
  readonly userSearchInput: Locator
  readonly userSearchResults: Locator
  readonly titleInput: Locator
  readonly bodyTextarea: Locator
  readonly linkInput: Locator
  readonly sendButton: Locator
  readonly toast: Locator

  constructor(page: Page) {
    super(page)
    this.userSearchInput = page.locator("#user-search")
    this.userSearchResults = page.locator("#user-search-results")
    this.titleInput = page.locator("#notif-title")
    this.bodyTextarea = page.locator("#notif-body")
    this.linkInput = page.locator("#notif-link")
    this.sendButton = page.locator("button").filter({ hasText: /Enviar notificación/i })
    this.toast = page.getByRole("status")
  }

  async goto(): Promise<void> {
    await this.page.goto("/smartrotom/gobierno/admin/notificaciones")
  }

  /** Selects a recipient by searching for their uuid and clicking the matching result. */
  async selectRecipient(uuid: string) {
    await this.userSearchInput.fill(uuid)
    await this.userSearchResults.locator(`button[data-uuid="${uuid}"]`).click()
  }

  async fillForm(opts: { uuid: string; title: string; body: string; link?: string }) {
    await this.selectRecipient(opts.uuid)
    await this.titleInput.fill(opts.title)
    await this.bodyTextarea.fill(opts.body)
    if (opts.link) await this.linkInput.fill(opts.link)
  }
}
