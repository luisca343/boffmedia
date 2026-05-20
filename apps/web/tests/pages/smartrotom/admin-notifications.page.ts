import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class AdminNotificationsPage extends BasePage {
  readonly uuidInput: Locator
  readonly typeSelect: Locator
  readonly titleInput: Locator
  readonly bodyTextarea: Locator
  readonly linkInput: Locator
  readonly sendButton: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  readonly userSearchInput: Locator

  constructor(page: Page) {
    super(page)
    this.uuidInput = page.locator("#uuid-input")
    this.typeSelect = page.locator("#type-select")
    this.titleInput = page.locator("#notif-title")
    this.bodyTextarea = page.locator("#notif-body")
    this.linkInput = page.locator("#notif-link")
    this.sendButton = page.locator("button").filter({ hasText: /Enviar Notificación/i })
    this.successMessage = page.locator(".text-green-400")
    this.errorMessage = page.locator(".text-red-400")
    this.userSearchInput = page.locator("#user-search")
  }

  async goto(): Promise<void> {
    await this.page.goto("/smartrotom/admin/notifications")
  }

  async fillForm(opts: { uuid: string; title: string; body: string; link?: string }) {
    await this.uuidInput.fill(opts.uuid)
    await this.titleInput.fill(opts.title)
    await this.bodyTextarea.fill(opts.body)
    if (opts.link) await this.linkInput.fill(opts.link)
  }
}
