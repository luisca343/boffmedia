import { expect, type Page } from "@playwright/test"

/**
 * Assert the browser is really on the page under test.
 *
 * The failure this exists to prevent: an unauthorised session is redirected away, the
 * spec's locators resolve to nothing (or, worse, to something similar on the page it
 * landed on), and a green run says the admin surface is covered when it was never
 * opened. A URL check alone is not enough either — Next renders the redirect
 * client-side, so the URL can still be the admin one for a moment while the gate is
 * deciding.
 *
 * So both must hold: the URL matches, AND a DOM marker that is only rendered past the
 * authorisation gate is present.
 */
export async function expectOnPage(page: Page, urlPattern: RegExp, marker: string): Promise<void> {
  await expect(page.locator(marker).first(), `page marker "${marker}" is absent — the page under test never rendered`).toBeAttached({
    timeout: 15_000,
  })
  expect(page.url(), `landed on the wrong URL — expected ${urlPattern}`).toMatch(urlPattern)
}

/** The marker `gobierno/admin/layout.tsx` renders only after the ROTOM_ADMIN gate passes. */
export const ADMIN_MARKER = "[data-admin-surface='gobierno']"

/**
 * Assert we are on an Administración page, authorised. A redirect to /smartrotom/gobierno
 * (what a non-admin gets) fails here instead of sliding through.
 */
export async function expectOnAdminSurface(page: Page, slug: string): Promise<void> {
  await expectOnPage(page, new RegExp(`/smartrotom/gobierno/admin/${slug}(\\?|$|/)`), ADMIN_MARKER)
}

/**
 * Assert we were NOT let in — the inverse guard, for proving the gate actually bites.
 */
export async function expectBouncedFromAdmin(page: Page): Promise<void> {
  await expect(page.locator(ADMIN_MARKER)).toHaveCount(0)
  expect(page.url()).not.toMatch(/\/smartrotom\/gobierno\/admin\//)
}
