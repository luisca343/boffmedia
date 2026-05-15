import { glob } from 'glob'
import fs from 'fs'
import path from 'path'
import { REPO_ROOT } from './runner.js'

interface ContextInput {
  taskDescription: string
  maxFiles: number
}

export async function resolveContext(input: ContextInput) {
  const { taskDescription, maxFiles } = input
  const desc = taskDescription.toLowerCase()
  const candidates: string[] = []

  if (/endpoint|controller|route|api|service/.test(desc))
    candidates.push(...await glob('apps/api/src/**/*.{controller,service,module}.ts', { cwd: REPO_ROOT }))

  if (/page|component|view|ui|layout/.test(desc))
    candidates.push(...await glob('apps/web/src/app/**/*.{tsx,ts}', { cwd: REPO_ROOT }))

  if (/feature|slice|hook/.test(desc))
    candidates.push(...await glob('apps/web/src/features/**/*.{ts,tsx}', { cwd: REPO_ROOT }))

  const entities = taskDescription.match(/\b([A-Z][a-z]+)\b/g) ?? []
  for (const entity of entities) {
    candidates.push(...await glob(`apps/**/*${entity.toLowerCase()}*.{ts,tsx}`, { cwd: REPO_ROOT }))
  }

  candidates.push(...await glob('packages/shared/src/**/*.ts', { cwd: REPO_ROOT }))

  const unique = [...new Set(candidates)].slice(0, maxFiles)
  const files = unique
    .filter(p => {
      const abs = path.resolve(REPO_ROOT, p)
      return fs.existsSync(abs)
    })
    .map(p => ({
      path: p,
      content: fs.readFileSync(path.resolve(REPO_ROOT, p), 'utf-8')
    }))

  const conventionsPath = path.join(REPO_ROOT, 'CONVENTIONS.md')
  const conventions = fs.existsSync(conventionsPath)
    ? fs.readFileSync(conventionsPath, 'utf-8')
    : ''

  const moduleList = await glob('apps/api/src/*/*.module.ts', { cwd: REPO_ROOT })
    .then(f => f.map(p => path.basename(p, '.module.ts')))

  const pageList = await glob('apps/web/src/app/**/page.tsx', { cwd: REPO_ROOT })
    .then(f => f.map(p => path.dirname(p).replace('apps/web/src/app', '')))

  return {
    files,
    moduleList,
    pageList,
    conventions,
    totalTokenEstimate: files.reduce((acc, f) => acc + Math.ceil(f.content.length / 4), 0)
  }
}
