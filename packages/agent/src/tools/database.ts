import { shell } from './runner.js'

interface SeedInput {
  fixture: string
}

interface SeedResult {
  status: 'ok' | 'error'
  output: string
}

export async function seedDatabase(input: SeedInput): Promise<SeedResult> {
  const r = await shell('seed.sh', [input.fixture])
  return {
    status: r.exitCode === 0 ? 'ok' : 'error',
    output: r.stdout + r.stderr
  }
}

export async function migrateDatabase(): Promise<SeedResult> {
  const r = await shell('migrate.sh', [])
  return {
    status: r.exitCode === 0 ? 'ok' : 'error',
    output: r.stdout + r.stderr
  }
}
