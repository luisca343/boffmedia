import fs from 'fs'
import path from 'path'
import ignore from 'ignore'
import { REPO_ROOT } from './runner.js'

interface GuardrailsInput {
  paths: string[]
}

interface GuardrailsResult {
  safe: boolean
  violations: Array<{ path: string; reason: string }>
}

export async function checkGuardrails(input: GuardrailsInput): Promise<GuardrailsResult> {
  const ignorePath = path.join(REPO_ROOT, '.agent-ignore')

  if (!fs.existsSync(ignorePath)) {
    return { safe: true, violations: [] }
  }

  const ig = ignore().add(fs.readFileSync(ignorePath, 'utf-8'))
  const violations = input.paths
    .filter(p => ig.ignores(p))
    .map(p => ({ path: p, reason: 'Matched .agent-ignore rule' }))

  return { safe: violations.length === 0, violations }
}
