import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class NotificationsPage extends BasePage {
  /** The bell button that triggers the notifications popover */
  readonly bellButton: Locator
  /** Badge on the bell showing the unread count */
  readonly unreadBadge: Locator
  /** Notifications popover content container */
  readonly popover: Locator
  /** The popover title heading */
  readonly title: Locator
  /** Empty-state message */
  readonly emptyState: Locator
  /** Loading indicator */
  readonly loadingState: Locator
  /** All notification items in the list */
  readonly notificationItems: Locator
  /** "Mark all as read" footer button */
  readonly markAllReadButton: Locator

  constructor(page: Page) {
    super(page)
    // PopoverTrigger renders a <button> containing NotificationButton's <span aria-label="Notifications">
    this.bellButton = page.locator('button:has([aria-label="Notifications"])')
    // SmartRotomBadge rendered as absolute badge over the bell button (-bottom-2 -right-2 absolute)
    this.unreadBadge = page.locator(".\\-bottom-2.\\-right-2.absolute")
    this.popover = page.locator(".w-80.bg-surface-800")
    this.title = page.locator(".w-80.bg-surface-800 h2")
    this.emptyState = page.locator(".w-80.bg-surface-800").getByText(/no.*notificaciones|no notifications|vacío|empty/i)
    this.loadingState = page.locator(".w-80.bg-surface-800").getByText(/cargando|loading/i)
    this.notificationItems = page.locator(".w-80.bg-surface-800 .p-3.space-y-2 > div")
    this.markAllReadButton = page.getByRole("button", { name: /marcar todas|mark all/i })
  }

  async goto() {
    await this.page.goto("/smartrotom")
  }

  /** Open the notifications popover by clicking the bell trigger */
  async openPopover() {
    await this.bellButton.click()
    // Wait for popover to appear
    await this.popover.waitFor({ state: "visible", timeout: 5000 })
  }

  /** Get the mark-as-read button for a specific notification item (0-indexed) */
  markReadButton(index: number): Locator {
    return this.notificationItems.nth(index).getByRole("button", { name: /mark as read|marcar como le/i })
  }
}
