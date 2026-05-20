import { test, expect } from "../../fixtures"
import { mockGet, mockPatch, apiOk } from "../../helpers/api"

const NOTIFICATIONS_URL = "https://api.ficuslab.es/smartrotom/notifications**"
const MARK_READ_URL = "https://api.ficuslab.es/smartrotom/notifications/*/read"
const MARK_ALL_URL = "https://api.ficuslab.es/smartrotom/notifications/read-all"

const mockNotificationRead = {
  id: 1,
  userUuid: "mock-uuid",
  type: "chatapp",
  title: "Mensaje de Ash",
  body: "Hola! ¿Juegas hoy?",
  link: null,
  isRead: 1,
  createdAt: "2025-01-01T10:00:00.000Z",
}

const mockNotificationUnread = {
  id: 2,
  userUuid: "mock-uuid",
  type: "starbank",
  title: "Transferencia recibida",
  body: "Has recibido 500 monedas de Misty",
  link: "/smartrotom/starbank",
  isRead: 0,
  createdAt: "2025-01-01T11:00:00.000Z",
}

test.describe("Notifications bell (RotomNav)", () => {
  test(
    "shows empty state when there are no notifications",
    { tag: "@smoke" },
    async ({ notificationsPage, page }) => {
      await mockGet(page, NOTIFICATIONS_URL, apiOk({ items: [], total: 0 }))
      await notificationsPage.goto()
      await notificationsPage.openPopover()
      await expect(notificationsPage.emptyState).toBeVisible()
    }
  )

  test(
    "renders notification items from the server",
    { tag: "@smoke" },
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({ items: [mockNotificationRead, mockNotificationUnread], total: 2 })
      )
      await notificationsPage.goto()
      await notificationsPage.openPopover()
      await expect(page.getByText("Mensaje de Ash")).toBeVisible()
      await expect(page.getByText("Transferencia recibida")).toBeVisible()
    }
  )

  test(
    "shows unread count badge for unread notifications",
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({ items: [mockNotificationUnread], total: 1 })
      )
      await notificationsPage.goto()
      // Badge should show "1" for the one unread notification
      await expect(notificationsPage.unreadBadge).toBeVisible()
      await expect(notificationsPage.unreadBadge).toContainText("1")
    }
  )

  test(
    "does not show unread badge when all notifications are read",
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({ items: [mockNotificationRead], total: 1 })
      )
      await notificationsPage.goto()
      await expect(notificationsPage.unreadBadge).not.toBeVisible()
    }
  )

  test(
    "mark-as-read button removes the unread indicator for that item",
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({ items: [mockNotificationUnread], total: 1 })
      )
      await mockPatch(page, MARK_READ_URL, apiOk(null))
      await notificationsPage.goto()
      await notificationsPage.openPopover()

      const markReadBtn = notificationsPage.markReadButton(0)
      await expect(markReadBtn).toBeVisible()
      await markReadBtn.click()
      // Button should disappear after optimistic update
      await expect(markReadBtn).not.toBeVisible()
    }
  )

  test(
    "mark-all-read button removes all unread indicators",
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({
          items: [mockNotificationUnread, { ...mockNotificationUnread, id: 3, title: "Otra notif" }],
          total: 2,
        })
      )
      await mockPatch(page, MARK_ALL_URL, apiOk(null))
      await notificationsPage.goto()
      await notificationsPage.openPopover()

      await expect(notificationsPage.markAllReadButton).toBeVisible()
      await notificationsPage.markAllReadButton.click()

      // After mark-all-read both mark-read buttons should disappear
      const markReadBtns = page.getByRole("button", { name: /mark as read|marcar como le/i })
      await expect(markReadBtns).toHaveCount(0)
    }
  )

  test(
    "popover header shows notification count badge for unread items",
    async ({ notificationsPage, page }) => {
      await mockGet(
        page,
        NOTIFICATIONS_URL,
        apiOk({
          items: [mockNotificationUnread, { ...mockNotificationUnread, id: 4 }],
          total: 2,
        })
      )
      await notificationsPage.goto()
      await notificationsPage.openPopover()

      // The popover header should show a SmartRotomBadge with "2"
      const headerBadge = notificationsPage.popover.locator(".inline-flex").filter({ hasText: "2" })
      await expect(headerBadge).toBeVisible()
    }
  )
})
