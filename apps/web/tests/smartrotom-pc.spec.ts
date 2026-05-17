import { test, expect } from '@playwright/test'

const TEST_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'

const mockSession = {
  user: {
    id: '1',
    email: 'ash@pokemon.com',
    name: 'Ash Ketchum',
    username: 'AshKetchum',
    roles: ['user'],
    smartRotomUser: { username: 'Ash', uuid: TEST_UUID, world: 'world1' },
    accessToken: 'mock-jwt-token',
  },
  expires: '2999-01-01T00:00:00.000Z',
}

// A minimal PC slot: 30 boxes, first slot has a Pikachu
const mockPCData = Array.from({ length: 30 }, (_, boxIndex) =>
  Array.from({ length: 30 }, (_, slotIndex) =>
    boxIndex === 0 && slotIndex === 0
      ? { id: 1, uniqueId: 'pikachu-1', species: 'Pikachu', level: 50, shiny: false, box: 1, slot: 1, nickname: null }
      : null,
  ),
)

const apiOk = (data: unknown) =>
  JSON.stringify({ success: true, statusCode: 200, message: 'ok', data })

function setupPCMocks(page: any) {
  page.route('**/api/auth/session', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) })
  })

  // Wingull PC — the page calls WingullService.getPC() which goes through the API
  page.route(/\/smartrotom\/wingull\/pc/, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(mockPCData) })
  })

  // Battle teams endpoint
  page.route(/\/smartrotom\/.+\/teams/, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk([]) })
  })

  // Catch-all: any remaining smartrotom API calls return empty success
  page.route(/\/smartrotom\//, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(null) })
  })
}

test.describe('SmartRotom PC Box page', () => {
  test.beforeEach(async ({ page }) => {
    setupPCMocks(page)
  })

  test('page loads without crashing (no 404 or error page)', async ({ page }) => {
    const response = await page.goto('/smartrotom/pc')
    expect(response?.status()).toBeLessThan(400)
    await expect(page).not.toHaveURL(/404|error/)
  })

  test('is accessible from an external browser without MCEF', async ({ page }) => {
    // Navigate without any MCEF headers or plugins — verifies the page renders in a standard browser
    await page.goto('/smartrotom/pc')
    await page.waitForLoadState('networkidle')

    // Page has a non-empty body — not a blank screen
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('shows PC header or navigation after session is loaded', async ({ page }) => {
    await page.goto('/smartrotom/pc')
    await page.waitForLoadState('networkidle')

    // The PC page has a header component — verify some UI is present
    // We check that the page is not in a loading-only state indefinitely
    const hasContent = await page.locator('body').evaluate((body) => {
      const text = body.innerText
      return text.length > 20
    })
    expect(hasContent).toBe(true)
  })
})
