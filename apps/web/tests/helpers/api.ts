import { Page } from "@playwright/test"

export function apiOk<T>(data: T) {
  return { success: true, statusCode: 200, message: "ok", data }
}

export async function mockGet(page: Page, url: string, body: unknown) {
  await page.route(url, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  )
}

export async function mockPost(page: Page, url: string, body: unknown) {
  await page.route(url, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  )
}
