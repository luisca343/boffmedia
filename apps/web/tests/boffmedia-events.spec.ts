import { test, expect } from '@playwright/test'

// Intercept the backend API regardless of which base URL the environment uses
const EVENTS_URL = /\/events(\?.*)?$/
const LEADERBOARDS_URL = /\/events\/leaderboards(\?.*)?$/

const mockEvents = [
  {
    id: 101,
    title: 'Torneo Pokémon VGC',
    description: 'Primer torneo oficial de la temporada',
    type: 'event',
    visibility: 'public',
    gameId: 1,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    icon: '',
    banner: '',
  },
  {
    id: 102,
    title: 'Liga SmartRotom',
    description: 'Competición de liga mensual',
    type: 'event',
    visibility: 'public',
    gameId: 1,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    icon: '',
    banner: '',
  },
]

const mockLeaderboard = [
  { userId: 1, nickname: 'AshKetchum99', totalPoints: 3200, medalCount: '5', achievementCount: '12' },
  { userId: 2, nickname: 'MistyWater77', totalPoints: 2800, medalCount: '4', achievementCount: '9' },
  { userId: 3, nickname: 'BrockRock55', totalPoints: 1500, medalCount: '2', achievementCount: '6' },
]

const apiOk = (data: unknown) =>
  JSON.stringify({ success: true, statusCode: 200, message: 'ok', data })

test.describe('Boffmedia Events page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(EVENTS_URL, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(mockEvents) })
    })
  })

  test('loads and shows the events heading', async ({ page }) => {
    await page.goto('/eventos')
    await expect(page.getByRole('heading', { name: /Centro de Eventos/i })).toBeVisible()
  })

  test('shows mocked event titles in the grid', async ({ page }) => {
    await page.goto('/eventos')
    await expect(page.getByText('Torneo Pokémon VGC')).toBeVisible()
    await expect(page.getByText('Liga SmartRotom')).toBeVisible()
  })

  test('search input filters visible events by title', async ({ page }) => {
    await page.goto('/eventos')
    await page.waitForFunction(() => document.title !== 'Loading…')

    await page.getByPlaceholder('Buscar evento...').fill('Torneo')

    await expect(page.getByText('Torneo Pokémon VGC')).toBeVisible()
    await expect(page.getByText('Liga SmartRotom')).not.toBeVisible()
  })

  test('shows loading state before content', async ({ page }) => {
    // Override with delayed response
    await page.route(EVENTS_URL, async (route) => {
      await new Promise((r) => setTimeout(r, 400))
      await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(mockEvents) })
    })

    await page.goto('/eventos')
    await expect(page.getByText('Cargando eventos...')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Centro de Eventos/i })).toBeVisible()
  })
})

test.describe('Boffmedia Leaderboard (clasificación) page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(LEADERBOARDS_URL, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: apiOk(mockLeaderboard) })
    })
  })

  test('loads and shows the leaderboard heading', async ({ page }) => {
    await page.goto('/clasificacion')
    await expect(page.getByRole('heading', { name: /Clasificación Global/i })).toBeVisible()
  })

  test('shows all mocked player nicknames', async ({ page }) => {
    await page.goto('/clasificacion')
    await expect(page.getByText('AshKetchum99')).toBeVisible()
    await expect(page.getByText('MistyWater77')).toBeVisible()
    await expect(page.getByText('BrockRock55')).toBeVisible()
  })

  test('top-ranked player appears before lower-ranked players', async ({ page }) => {
    await page.goto('/clasificacion')

    // Wait for content to settle
    await page.waitForSelector('text=AshKetchum99')

    const ashBox = await page.getByText('AshKetchum99').boundingBox()
    const mistyBox = await page.getByText('MistyWater77').boundingBox()

    expect(ashBox).not.toBeNull()
    expect(mistyBox).not.toBeNull()
    // AshKetchum99 has higher score so appears higher on page (smaller Y coordinate)
    expect(ashBox!.y).toBeLessThan(mistyBox!.y)
  })

  test('search filters players by nickname', async ({ page }) => {
    await page.goto('/clasificacion')
    await page.waitForSelector('text=AshKetchum99')

    await page.getByPlaceholder(/Buscar jugador/i).fill('MistyWater77')

    await expect(page.getByText('MistyWater77')).toBeVisible()
    await expect(page.getByText('AshKetchum99')).not.toBeVisible()
    await expect(page.getByText('BrockRock55')).not.toBeVisible()
  })
})
