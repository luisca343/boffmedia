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
    this.bellButton = page.getByRole("button", { name: /notifications|notificaciones/i })
    this.unreadBadge = page.locator("[data-testid='unread-badge']").or(
      // SmartRotomBadge positioned on the bell — match by proximity to the notification button
      page.locator(".relative > div.inline-flex").first()
    )
    this.popover = page.locator(".w-80.bg-surface-800.border-2.border-black")
    this.title = page.getByRole("heading", { name: /notifications|notificaciones/i })
    this.emptyState = page.getByText(/no.*notificaciones|no notifications/i)
    this.loadingState = page.getByText(/cargando|loading/i)
    this.notificationItems = page.locator(".w-80.bg-surface-800 > .p-3 > div")
    this.markAllReadButton = page.getByRole("button", { name: /marcar todas|mark all/i })
  }

  async goto() {
    await this.page.goto("/smartrotom")
  }

  /** Open the notifications popover by clicking the bell trigger */
  async openPopover() {
    // The NotificationButton is wrapped in PopoverTrigger
    await this.page.locator("button").filter({ has: this.page.locator("svg") }).nth(3).click()
  }

  /** Get the mark-as-read button for a specific notification item (0-indexed) */
  markReadButton(index: number): Locator {
    return this.notificationItems.nth(index).getByRole("button", { name: /mark as read|marcar como le/i })
  }
}
