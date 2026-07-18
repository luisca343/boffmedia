import { test, expect } from "../../fixtures"
import { mockGet, mockPost, apiOk } from "../../helpers/api"
import { ADMIN_MARKER, expectOnAdminSurface } from "../../helpers/pageMarker"

const USERS_URL = "https://api.ficuslab.es/smartrotom/users"
const SEND_URL = "https://api.ficuslab.es/smartrotom/notifications/send"

const mockUser = {
  id: 1,
  uuid: "test-uuid-1234-5678-abcd",
  username: "ProfesorFicus",
  energy: 10,
  lastCharge: "2025-01-01T10:00:00.000Z",
}

const mockNotificationResponse = {
  id: 99,
  userUuid: "test-uuid-1234-5678-abcd",
  type: "system",
  title: "Hola Admin",
  body: "Este es un mensaje de prueba",
  link: null,
  isRead: 0,
  createdAt: "2025-01-01T12:00:00.000Z",
}

test.describe("Admin — Send Notification page (Gobierno de Teras)", () => {
  // The guard this suite previously lacked. Every other test here reaches the page via
  // `adminNotificationsPage.goto()`, which now asserts the same marker — but this one
  // states the contract outright: without ROTOM_ADMIN the layout redirects to
  // /smartrotom/gobierno and the marker is never rendered, so a bounced run fails here
  // instead of asserting on whatever page it landed on.
  test("is actually on the authorised admin surface", { tag: "@smoke" }, async ({ page }) => {
    await mockGet(page, USERS_URL, apiOk([mockUser]))
    await page.goto("/smartrotom/gobierno/admin/notificaciones")

    await expectOnAdminSurface(page, "notificaciones")
    await expect(page.locator(ADMIN_MARKER)).toHaveCount(1)
    await expect(page.getByRole("heading", { name: "Notificaciones push", exact: true })).toBeVisible()
  })

  test(
    "renders the page with all form fields",
    { tag: "@smoke" },
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await expect(adminNotificationsPage.userSearchInput).toBeVisible()
      await expect(adminNotificationsPage.titleInput).toBeVisible()
      await expect(adminNotificationsPage.bodyTextarea).toBeVisible()
      await expect(adminNotificationsPage.linkInput).toBeVisible()
      await expect(adminNotificationsPage.sendButton).toBeVisible()
    }
  )

  test(
    "send button is disabled when required fields are empty",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await expect(adminNotificationsPage.sendButton).toBeDisabled()
    }
  )

  test(
    "send button is enabled when all required fields are filled",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await adminNotificationsPage.fillForm({
        uuid: mockUser.uuid,
        title: "Test title",
        body: "Test body content",
      })

      await expect(adminNotificationsPage.sendButton).toBeEnabled()
    }
  )

  test(
    "shows user results when searching by username",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await adminNotificationsPage.userSearchInput.fill("Profesor")
      await expect(page.getByText("ProfesorFicus")).toBeVisible()
    }
  )

  test(
    "clicking a user result selects them as the recipient",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await adminNotificationsPage.selectRecipient(mockUser.uuid)

      // Search results are replaced by the selected-recipient chip, which is the
      // only place the FULL (untruncated) uuid is rendered as text.
      await expect(adminNotificationsPage.userSearchResults).toBeHidden()
      await expect(page.getByText(mockUser.uuid, { exact: true })).toBeVisible()
    }
  )

  test(
    "shows a toast after sending a notification",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await mockPost(page, SEND_URL, { success: true, statusCode: 201, message: "ok", data: mockNotificationResponse })
      await adminNotificationsPage.goto()

      await adminNotificationsPage.fillForm({
        uuid: mockUser.uuid,
        title: "Hola Admin",
        body: "Este es un mensaje de prueba",
      })

      await adminNotificationsPage.sendButton.click()
      await expect(adminNotificationsPage.toast).toContainText("Notificación enviada")
    }
  )

  test(
    "shows an error toast when the API returns a failure",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await page.route(SEND_URL, (route) =>
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ success: false, statusCode: 400, error: "Bad Request", message: "Error de prueba" }),
        })
      )
      await adminNotificationsPage.goto()

      await adminNotificationsPage.fillForm({
        uuid: mockUser.uuid,
        title: "Hola Admin",
        body: "Este es un mensaje de prueba",
      })

      await adminNotificationsPage.sendButton.click()
      await expect(adminNotificationsPage.toast).toContainText("Bad Request")
    }
  )

  test(
    "clears title and body fields after a successful send",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await mockPost(page, SEND_URL, { success: true, statusCode: 201, message: "ok", data: mockNotificationResponse })
      await adminNotificationsPage.goto()

      await adminNotificationsPage.fillForm({
        uuid: mockUser.uuid,
        title: "Hola Admin",
        body: "Este es un mensaje de prueba",
      })

      await adminNotificationsPage.sendButton.click()
      await expect(adminNotificationsPage.toast).toContainText("Notificación enviada")
      await expect(adminNotificationsPage.titleInput).toHaveValue("")
      await expect(adminNotificationsPage.bodyTextarea).toHaveValue("")
    }
  )
})
