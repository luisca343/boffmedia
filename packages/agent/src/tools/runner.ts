import { execa } from 'execa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts')
const REPO_ROOT = path.resolve(__dirname, '../../../..')

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface ShellOptions {
  env?: NodeJS.ProcessEnv
}

export async function shell(
  script: string,
  args: string[] = [],
  options: ShellOptions = {}
): Promise<ShellResult> {
  const isScript = script.endsWith('.sh')
  const cmd = isScript ? 'bash' : script
  const cmdArgs = isScript ? [path.join(SCRIPTS_DIR, script), ...args] : args

  try {
    const result = await execa(cmd, cmdArgs, {
      reject: false,
      cwd: REPO_ROOT,
      env: { ...process.env, ...options.env }
    })

    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.exitCode ?? 0
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { stdout: '', stderr: message, exitCode: 1 }
  }
}

export { REPO_ROOT }
