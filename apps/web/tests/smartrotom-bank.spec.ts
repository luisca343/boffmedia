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

const mockAccounts = [
  { id: 1, uuid: TEST_UUID, name: 'Principal', balance: 4200, type: 'main', image: null },
  { id: 2, uuid: TEST_UUID, name: 'Ahorros', balance: 800, type: 'secondary', image: null },
]

const apiOk = (data: unknown) =>
  JSON.stringify({ success: true, statusCode: 200, message: 'ok', data })

async function setupBankMocks(page: any) {
  await page.route('**/api/auth/session', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) })
  })

  await page.route(
    new RegExp(`/smartrotom/starbank/accounts/${TEST_UUID.replace(/-/g, '\\-')}`),
    async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(mockAccounts) })
    },
  )

  await page.route(/\/smartrotom\/starbank\/transactions\/1/, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk([]) })
  })

  await page.route(/\/smartrotom\/starbank\/transfers\/1/, async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk([]) })
  })
}

test.describe('SmartRotom StarBank page', () => {
  test.beforeEach(async ({ page }) => {
    await setupBankMocks(page)
  })

  test('shows balance section heading', async ({ page }) => {
    await page.goto('/smartrotom/starbank')
    await expect(page.getByText('Balance de cuenta')).toBeVisible()
  })

  test('displays the account balance from mock data', async ({ page }) => {
    await page.goto('/smartrotom/starbank')
    // formatMoney(4200) → "4200 ¥" or similar — match the number
    await expect(page.getByText(/4200/)).toBeVisible()
  })

  test('shows "Cuenta Principal" under the balance', async ({ page }) => {
    await page.goto('/smartrotom/starbank')
    // The subtitle below the balance amount shows "Cuenta {name}"
    await expect(page.getByText('Cuenta Principal')).toBeVisible()
  })

  test('shows "Cambiar de Cuenta" account selector', async ({ page }) => {
    await page.goto('/smartrotom/starbank')
    await expect(page.getByText('Cambiar de Cuenta')).toBeVisible()
  })
})

test.describe('SmartRotom auth — login form', () => {
  test('login page renders username and password fields', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    // Submit button text is "Sign In" (English, not localized)
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  })

  test('shows "Username is required" when submitting empty form', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByText(/Username is required/i)).toBeVisible()
  })

  test('shows password length error when password is too short', async ({ page }) => {
    await page.goto('/auth')
    await page.getByPlaceholder('Enter your username').fill('ash')
    await page.getByPlaceholder('Enter your password').fill('short')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })

  test('register mode shows email and confirm password fields', async ({ page }) => {
    await page.goto('/auth?mode=register')
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible()
    // Register button text is "Register" (English)
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('form submit calls signIn and shows loading state', async ({ page }) => {
    // The NextAuth callback goes through the Next.js server-side handler which cannot
    // be intercepted with page.route() alone (it runs on the SSR layer).
    // We verify that clicking Sign In triggers the submit handler: button becomes
    // "Processing..." which confirms the client-side signIn() was invoked.
    await page.goto('/auth')
    await page.getByPlaceholder('Enter your username').fill('AshKetchum')
    await page.getByPlaceholder('Enter your password').fill('validpassword')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // onSubmit sets isLoading = true → button text changes to "Processing..."
    await expect(page.getByRole('button', { name: 'Processing...' })).toBeVisible()
  })
})
