import { shell } from './runner.js'

interface EnvironmentInput {
  action: 'up' | 'down' | 'status'
}

interface EnvironmentResult {
  status: 'ok' | 'error'
  output: string
}

export async function manageEnvironment(input: EnvironmentInput): Promise<EnvironmentResult> {
  const r = await shell('docker.sh', [input.action])
  return {
    status: r.exitCode === 0 ? 'ok' : 'error',
    output: r.stdout + r.stderr
  }
}
