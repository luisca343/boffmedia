import { shell } from './runner.js'

export interface StructuralChange {
  type: 'new_module' | 'new_entity' | 'new_service' | 'new_controller' | 'schema_change'
  file: string
  name: string
}

export interface StructuralChangesResult {
  hasStructuralChanges: boolean
  changes: StructuralChange[]
  adrRecommended: boolean
  suggestedAdrTitle: string
}

// ADR is warranted for module introductions and schema changes — not for services/controllers alone
const ADR_TYPES: StructuralChange['type'][] = ['new_module', 'new_entity', 'schema_change']

const FILE_PATTERNS: Array<{
  pattern: RegExp
  type: StructuralChange['type']
  nameOf: (file: string) => string
}> = [
  { pattern: /\.module\.ts$/, type: 'new_module',     nameOf: f => basename(f, '.module.ts') },
  { pattern: /\.entity\.ts$/, type: 'new_entity',     nameOf: f => basename(f, '.entity.ts') },
  { pattern: /\.service\.ts$/, type: 'new_service',   nameOf: f => basename(f, '.service.ts') },
  { pattern: /\.controller\.ts$/, type: 'new_controller', nameOf: f => basename(f, '.controller.ts') },
  // Drizzle schema files and raw SQL migrations
  { pattern: /\/(schema|migrations)\/.+\.ts$/, type: 'schema_change', nameOf: f => basename(f, '.ts') }
]

function basename(file: string, ext: string): string {
  return file.split('/').pop()!.replace(ext, '')
}

function parseLines(output: string, statusPrefix: string): string[] {
  return output
    .split('\n')
    .filter(l => l.startsWith(statusPrefix))
    .map(l => l.replace(new RegExp(`^${statusPrefix}\\s+`), '').trim())
    .filter(Boolean)
}

export async function detectStructuralChanges(): Promise<StructuralChangesResult> {
  // Collect changes from staged, unstaged, untracked, and the last commit
  const [staged, unstaged, untracked, lastCommit] = await Promise.all([
    shell('git', ['diff', '--name-status', '--cached', 'HEAD']),
    shell('git', ['diff', '--name-status', 'HEAD']),
    shell('git', ['ls-files', '--others', '--exclude-standard']),
    shell('git', ['diff', '--name-status', 'HEAD~1..HEAD'])
  ])

  const addedFiles = new Set([
    ...parseLines(staged.stdout,    'A'),
    ...parseLines(unstaged.stdout,  'A'),
    ...parseLines(lastCommit.stdout,'A'),
    ...untracked.stdout.split('\n').filter(Boolean)
  ])

  const modifiedFiles = new Set([
    ...parseLines(staged.stdout,    'M'),
    ...parseLines(unstaged.stdout,  'M'),
    ...parseLines(lastCommit.stdout,'M')
  ])

  const changes: StructuralChange[] = []
  const seen = new Set<string>()

  // Classify new files
  for (const file of addedFiles) {
    for (const { pattern, type, nameOf } of FILE_PATTERNS) {
      if (pattern.test(file) && !seen.has(file)) {
        seen.add(file)
        changes.push({ type, file, name: nameOf(file) })
        break
      }
    }
  }

  // Classify modified schema/migration files not already captured
  for (const file of modifiedFiles) {
    const schemaPattern = FILE_PATTERNS.find(p => p.type === 'schema_change')!
    if (schemaPattern.pattern.test(file) && !seen.has(file)) {
      seen.add(file)
      changes.push({ type: 'schema_change', file, name: basename(file, '.ts') })
    }
  }

  const adrRecommended = changes.some(c => ADR_TYPES.includes(c.type))

  // Build a concise suggested ADR title from the highest-priority change type
  const modules    = changes.filter(c => c.type === 'new_module').map(c => c.name)
  const entities   = changes.filter(c => c.type === 'new_entity').map(c => c.name)
  const schemaMods = changes.filter(c => c.type === 'schema_change').map(c => c.name)

  let suggestedAdrTitle = ''
  if (modules.length)    suggestedAdrTitle = `Introduce ${modules.join(', ')} module`
  else if (entities.length)   suggestedAdrTitle = `Add ${entities.join(', ')} entity`
  else if (schemaMods.length) suggestedAdrTitle = `Schema change — ${schemaMods.join(', ')}`

  return { hasStructuralChanges: changes.length > 0, changes, adrRecommended, suggestedAdrTitle }
}
