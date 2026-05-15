import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

// Load .env.agent from repo root; silently ignore if missing
config({ path: path.join(repoRoot, '.env.agent') })
