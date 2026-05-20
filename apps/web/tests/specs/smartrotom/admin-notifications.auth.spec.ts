import { test, expect } from "../../fixtures"
import { mockGet, mockPost, apiOk } from "../../helpers/api"

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

test.describe("Admin — Send Notification page", () => {
  test(
    "renders the page with all form fields",
    { tag: "@smoke" },
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await expect(adminNotificationsPage.uuidInput).toBeVisible()
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
    "clicking a user result populates the UUID field",
    async ({ adminNotificationsPage, page }) => {
      await mockGet(page, USERS_URL, apiOk([mockUser]))
      await adminNotificationsPage.goto()

      await adminNotificationsPage.userSearchInput.fill("Profesor")
      await page.getByText("ProfesorFicus").first().click()

      await expect(adminNotificationsPage.uuidInput).toHaveValue(mockUser.uuid)
    }
  )

  test(
    "shows success message after sending notification",
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
      await expect(adminNotificationsPage.successMessage).toBeVisible()
    }
  )

  test(
    "shows error message when API returns failure",
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
      await expect(adminNotificationsPage.errorMessage).toBeVisible()
    }
  )

  test(
    "clears title and body fields after successful send",
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
      await expect(adminNotificationsPage.successMessage).toBeVisible()
      await expect(adminNotificationsPage.titleInput).toHaveValue("")
      await expect(adminNotificationsPage.bodyTextarea).toHaveValue("")
    }
  )
})
